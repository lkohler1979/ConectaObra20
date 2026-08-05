import { Injectable } from "@nestjs/common";
import type { Kpis } from "@conectaobra/types/kpis";
import type { ChatMensagem } from "@conectaobra/types/ai-chat";
import { PrismaService } from "../../common/prisma/prisma.service";

const DIA_MS = 24 * 60 * 60 * 1000;
const SEMANA_MS = 7 * DIA_MS;

const STATUS_ASSINATURA_INATIVA = ["CANCELADA", "CANCELLED", "EXPIRADA", "EXPIRED"];

/**
 * Dashboard de KPIs (E10-03, `01_PRD` §3) — calculado direto do Postgres,
 * determinístico (CLAUDE.md §5 regra 3), sem depender do PostHog. MRR/churn
 * refletem a realidade de hoje: `Subscription` existe no schema desde
 * S0-05, mas nenhum código cria uma linha ali ainda (E8/billing não
 * implementado) — os dois sempre reportam 0/null em qualquer ambiente
 * atual, o que é honesto, não um bug.
 */
@Injectable()
export class AdminKpisService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(): Promise<Kpis> {
    const [liquidez, confianca, receita, adocaoIa, churn, ativacao] = await Promise.all([
      this.computeLiquidez(),
      this.computeConfianca(),
      this.computeReceita(),
      this.computeAdocaoIa(),
      this.computeChurn(),
      this.computeAtivacao(),
    ]);

    return {
      computedAt: new Date().toISOString(),
      liquidez,
      confianca,
      receita,
      adocaoIa,
      churn,
      ativacao,
    };
  }

  /** Liquidez: % de RFQs (já com 24h de vida) que receberam ao menos 1 proposta em até 24h da publicação. */
  private async computeLiquidez(): Promise<Kpis["liquidez"]> {
    const cutoff = new Date(Date.now() - DIA_MS);
    const rfqs = await this.prisma.rfq.findMany({
      where: { createdAt: { lte: cutoff } },
      select: { id: true, createdAt: true },
    });

    if (rfqs.length === 0) {
      return { percentualRespondidoEm24h: 0, totalRfqsConsiderados: 0 };
    }

    const primeirasPropostas = await Promise.all(
      rfqs.map((rfq) =>
        this.prisma.rfqProposal.findFirst({
          where: { rfqId: rfq.id },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        }),
      ),
    );

    const respondidosEm24h = rfqs.filter((rfq, i) => {
      const primeira = primeirasPropostas[i];
      return primeira && primeira.createdAt.getTime() - rfq.createdAt.getTime() <= DIA_MS;
    }).length;

    return {
      percentualRespondidoEm24h: (respondidosEm24h / rfqs.length) * 100,
      totalRfqsConsiderados: rfqs.length,
    };
  }

  /**
   * Confiança: disputas / "transações". PRD não define "transação" com
   * precisão — interpretado aqui como Contract (negócio fechado), decisão
   * documentada em PENDENCIAS.md, não uma leitura óbvia única possível.
   */
  private async computeConfianca(): Promise<Kpis["confianca"]> {
    const [totalDisputas, totalTransacoes] = await Promise.all([
      this.prisma.dispute.count(),
      this.prisma.contract.count(),
    ]);

    return {
      disputasPorTransacao: totalTransacoes > 0 ? totalDisputas / totalTransacoes : 0,
      totalDisputas,
      totalTransacoes,
    };
  }

  private async computeReceita(): Promise<Kpis["receita"]> {
    const assinaturas = await this.prisma.subscription.findMany({
      where: { status: { notIn: STATUS_ASSINATURA_INATIVA } },
      select: { valorCentavos: true },
    });

    return {
      mrrCentavos: assinaturas.reduce((soma, s) => soma + s.valorCentavos, 0),
      totalAssinaturasAtivas: assinaturas.length,
    };
  }

  /** Adoção de IA: % de clientes (PF/PJ) com ≥3 perguntas na última semana. */
  private async computeAdocaoIa(): Promise<Kpis["adocaoIa"]> {
    const cutoff = new Date(Date.now() - SEMANA_MS);

    const [totalClientes, conversas] = await Promise.all([
      this.prisma.user.count({
        where: { tipo: { in: ["CLIENTE_PF", "CLIENTE_PJ"] }, deletedAt: null },
      }),
      this.prisma.aiConversation.findMany({ select: { userId: true, mensagens: true } }),
    ]);

    const perguntasPorUsuario = new Map<string, number>();
    for (const conversa of conversas) {
      const mensagens = Array.isArray(conversa.mensagens)
        ? (conversa.mensagens as unknown as ChatMensagem[])
        : [];
      const perguntasNaSemana = mensagens.filter(
        (m) => m.role === "user" && new Date(m.createdAt) >= cutoff,
      ).length;
      if (perguntasNaSemana === 0) continue;
      perguntasPorUsuario.set(
        conversa.userId,
        (perguntasPorUsuario.get(conversa.userId) ?? 0) + perguntasNaSemana,
      );
    }

    const ativosComIa = [...perguntasPorUsuario.values()].filter((total) => total >= 3).length;

    return {
      percentualClientesAtivosComIa: totalClientes > 0 ? (ativosComIa / totalClientes) * 100 : 0,
      totalClientes,
      totalClientesComTresPerguntasSemana: ativosComIa,
    };
  }

  /** Sem billing real (E8), não há evento de cancelamento pra medir churn de verdade. */
  private async computeChurn(): Promise<Kpis["churn"]> {
    return { churnMensalPercentual: null };
  }

  /** Ativação: % de clientes que criaram obra E publicaram RFQ nos 7 dias após o cadastro. */
  private async computeAtivacao(): Promise<Kpis["ativacao"]> {
    const clientes = await this.prisma.user.findMany({
      where: { tipo: { in: ["CLIENTE_PF", "CLIENTE_PJ"] }, deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        obras: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
        rfqs: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });

    if (clientes.length === 0) {
      return { percentualAtivadoEm7Dias: 0, totalClientesConsiderados: 0 };
    }

    const ativados = clientes.filter((cliente) => {
      const prazo = cliente.createdAt.getTime() + SEMANA_MS;
      const criouObra = cliente.obras[0] && cliente.obras[0].createdAt.getTime() <= prazo;
      const criouRfq = cliente.rfqs[0] && cliente.rfqs[0].createdAt.getTime() <= prazo;
      return Boolean(criouObra && criouRfq);
    }).length;

    return {
      percentualAtivadoEm7Dias: (ativados / clientes.length) * 100,
      totalClientesConsiderados: clientes.length,
    };
  }
}
