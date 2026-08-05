import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateRfqProposalInput,
  RfqProposalPublic,
} from "@conectaobra/types/rfq-proposals";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { env } from "../../config/env";
import { toPublicRfqProposal } from "./rfq-proposal-public.mapper";

@Injectable()
export class RfqProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly analytics: AnalyticsService,
  ) {}

  async submit(
    rfqId: string,
    proponenteId: string,
    input: CreateRfqProposalInput,
  ): Promise<RfqProposalPublic> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException("RFQ não encontrado");
    }
    if (rfq.status !== "ABERTO") {
      throw new ConflictException("Este RFQ não está mais aberto para propostas");
    }

    // Checagem "rápida" pra dar um erro amigável no caso comum — mas quem
    // garante a regra de fato é a constraint única no banco (achado em code
    // review: um check-then-insert sozinho permite duplicata sob concorrência).
    const existing = await this.prisma.rfqProposal.findFirst({
      where: { rfqId, proponenteId },
    });
    if (existing) {
      throw new ConflictException("Você já enviou uma proposta para este RFQ");
    }

    let proposal;
    try {
      proposal = await this.prisma.$transaction(async (tx) => {
        // Serializa submissões concorrentes do MESMO prestador (fecha a
        // race do teto mensal — P-028, achado em code review: count-then-
        // -insert sem lock deixava passar 1 proposta a mais sob
        // concorrência) sem travar outros prestadores enviando ao mesmo
        // tempo. Lock transacional — libera sozinho no commit/rollback.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${proponenteId}))`;

        await this.enforceMonthlyCap(tx, proponenteId);

        return tx.rfqProposal.create({
          data: {
            rfqId,
            proponenteId,
            precoCentavos: input.precoCentavos,
            prazoDias: input.prazoDias,
            observacoes: input.observacoes,
          },
          include: { proponente: { select: { nome: true } } },
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Você já enviou uma proposta para este RFQ");
      }
      throw err;
    }

    await this.auditLog.record({
      userId: proponenteId,
      obraId: rfq.obraId,
      acao: "rfq_proposal.created",
      entidade: "rfq_proposal",
      payload: { rfqId, proposalId: proposal.id },
    });
    this.analytics.capture(proponenteId, "rfq_proposal_submitted", {
      rfqId,
      proposalId: proposal.id,
    });

    return toPublicRfqProposal(proposal);
  }

  /**
   * O dono do RFQ vê todas as propostas; um prestador só vê a própria —
   * é um leilão, ninguém pode ver o preço/prazo da concorrência.
   */
  async listForRfq(rfqId: string, requesterId: string): Promise<RfqProposalPublic[]> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException("RFQ não encontrado");
    }

    if (rfq.clienteId === requesterId) {
      const proposals = await this.prisma.rfqProposal.findMany({
        where: { rfqId },
        orderBy: { createdAt: "asc" },
        include: { proponente: { select: { nome: true } } },
      });
      return proposals.map(toPublicRfqProposal);
    }

    const own = await this.prisma.rfqProposal.findFirst({
      where: { rfqId, proponenteId: requesterId },
      include: { proponente: { select: { nome: true } } },
    });
    return own ? [toPublicRfqProposal(own)] : [];
  }

  /**
   * Placeholder até E8-01 definir os planos de verdade (P-025): sem nenhuma
   * Subscription, o prestador é tratado como plano gratuito e sujeito ao
   * teto mensal; qualquer Subscription (seja qual for o plano) isenta por
   * enquanto — não há ainda tiers pagos distintos implementados.
   */
  private async enforceMonthlyCap(
    tx: Prisma.TransactionClient,
    proponenteId: string,
  ): Promise<void> {
    const hasSubscription = await tx.subscription.findFirst({
      where: { userId: proponenteId },
    });
    if (hasSubscription) return;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const count = await tx.rfqProposal.count({
      where: { proponenteId, createdAt: { gte: startOfMonth } },
    });

    if (count >= env.FREE_PLAN_MONTHLY_PROPOSAL_LIMIT) {
      throw new ForbiddenException(
        `Limite de ${env.FREE_PLAN_MONTHLY_PROPOSAL_LIMIT} propostas por mês do plano gratuito atingido — assine um plano pago pra continuar`,
      );
    }
  }
}
