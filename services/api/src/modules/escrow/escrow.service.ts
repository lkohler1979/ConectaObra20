import { createHash, randomUUID } from "node:crypto";
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ContractPartyRole, type EscrowTransaction, type Milestone } from "@prisma/client";
import type {
  EscrowTransactionPublic,
  ExtratoFinanceiro,
  ExtratoFinanceiroItem,
} from "@conectaobra/types/escrow";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { env } from "../../config/env";
import { toPublicEscrowTransaction } from "./escrow-transaction-public.mapper";

interface AppendLedgerInput {
  milestoneId: string;
  tipo: "DEPOSITO" | "LIBERACAO" | "ESTORNO" | "COMISSAO";
  valorCentavos: number;
  taxaPlataformaCentavos: number | null;
  status: string;
}

/**
 * Hub Financeiro / Escrow (E4) — PSP **simulado**, sempre sucesso (P-002 em
 * aberto, ver PENDENCIAS.md). Depósito e liberação são instantâneos, sem
 * chamar nenhum provedor real; `pspRef` é sempre sintético. Feito assim a
 * pedido explícito do usuário, pra não travar o desenvolvimento do resto do
 * produto esperando a escolha do PSP/BaaS real.
 *
 * `EscrowTransaction` (schema + trigger append-only) já existia desde S0-05
 * — nunca tinha endpoints. `ledgerHash`/`previousHash` encadeiam as
 * transações (E4-05) via SHA-256, serializado por `pg_advisory_xact_lock`
 * pra evitar corrida entre depósitos/liberações concorrentes.
 */
@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Depósito em custódia (E4-04) — exclusivo do CONTRATANTE, só enquanto a etapa está `PENDENTE`. */
  async depositar(
    clienteId: string,
    contractId: string,
    milestoneId: string,
  ): Promise<EscrowTransactionPublic> {
    await this.requireRole(contractId, clienteId, "CONTRATANTE");
    const milestone = await this.getOwnedOrThrow(contractId, milestoneId);

    if (milestone.status !== "PENDENTE") {
      throw new ConflictException(
        "Só é possível depositar em custódia enquanto a etapa está pendente",
      );
    }

    const jaDepositado = await this.prisma.escrowTransaction.findFirst({
      where: { milestoneId, tipo: "DEPOSITO" },
    });
    if (jaDepositado) {
      throw new ConflictException("Esta etapa já tem depósito em custódia confirmado");
    }

    const transacao = await this.prisma.$transaction((tx) =>
      this.appendLedger(tx, {
        milestoneId,
        tipo: "DEPOSITO",
        valorCentavos: milestone.valorCentavos,
        taxaPlataformaCentavos: null,
        status: "CONFIRMADO",
      }),
    );

    await this.auditLog.record({
      userId: clienteId,
      obraId: await this.getObraId(contractId),
      acao: "escrow.deposito",
      entidade: "escrow_transaction",
      payload: {
        milestoneId,
        transacaoId: transacao.id,
        valorCentavos: milestone.valorCentavos,
        simulado: true,
      },
    });

    return toPublicEscrowTransaction(transacao);
  }

  /**
   * Liberação automática (E4-07) — chamada por `MilestonesService.aprovar()`
   * logo depois de marcar `APROVADO`. Só libera se houver depósito
   * confirmado e ainda não liberado (idempotente); sem depósito prévio, não
   * faz nada — etapas que nunca usaram escrow continuam funcionando como
   * antes (decisão confirmada com o usuário nesta sessão).
   */
  async liberarSeDepositado(
    contractId: string,
    milestoneId: string,
    requesterId: string,
  ): Promise<Milestone | null> {
    const deposito = await this.prisma.escrowTransaction.findFirst({
      where: { milestoneId, tipo: "DEPOSITO" },
    });
    if (!deposito) {
      return null;
    }

    const jaLiberado = await this.prisma.escrowTransaction.findFirst({
      where: { milestoneId, tipo: "LIBERACAO" },
    });
    if (jaLiberado) {
      return null;
    }

    const comissaoCentavos = Math.round(
      (deposito.valorCentavos * env.ESCROW_COMMISSION_BPS) / 10_000,
    );
    const valorLiquidoCentavos = deposito.valorCentavos - comissaoCentavos;

    const milestoneAtualizado = await this.prisma.$transaction(async (tx) => {
      await this.appendLedger(tx, {
        milestoneId,
        tipo: "LIBERACAO",
        valorCentavos: valorLiquidoCentavos,
        taxaPlataformaCentavos: comissaoCentavos,
        status: "CONFIRMADO",
      });
      await this.appendLedger(tx, {
        milestoneId,
        tipo: "COMISSAO",
        valorCentavos: comissaoCentavos,
        taxaPlataformaCentavos: null,
        status: "CONFIRMADO",
      });
      return tx.milestone.update({ where: { id: milestoneId }, data: { status: "PAGO" } });
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "escrow.liberado",
      entidade: "escrow_transaction",
      payload: { milestoneId, valorLiquidoCentavos, comissaoCentavos, simulado: true },
    });

    return milestoneAtualizado;
  }

  /**
   * Estorno total (E4-10) — chamado pela resolução de disputa (`DisputesService`)
   * quando o mediador decide `ESTORNAR`. Devolve o valor depositado ao
   * cliente e reabre a etapa em `PENDENTE` (o trabalho pode ser refeito do
   * zero). Idempotente e silencioso se nunca houve depósito ou já foi
   * estornado — a decisão de mediação ainda precisa fazer sentido nesses
   * casos, só não move dinheiro.
   */
  async estornarDeposito(
    contractId: string,
    milestoneId: string,
    requesterId: string,
  ): Promise<Milestone> {
    const deposito = await this.prisma.escrowTransaction.findFirst({
      where: { milestoneId, tipo: "DEPOSITO" },
    });
    const jaEstornado = deposito
      ? await this.prisma.escrowTransaction.findFirst({
          where: { milestoneId, tipo: "ESTORNO" },
        })
      : null;

    const milestoneAtualizado = await this.prisma.$transaction(async (tx) => {
      if (deposito && !jaEstornado) {
        await this.appendLedger(tx, {
          milestoneId,
          tipo: "ESTORNO",
          valorCentavos: deposito.valorCentavos,
          taxaPlataformaCentavos: null,
          status: "CONFIRMADO",
        });
      }
      return tx.milestone.update({ where: { id: milestoneId }, data: { status: "PENDENTE" } });
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "escrow.estornado",
      entidade: "escrow_transaction",
      payload: { milestoneId, valorCentavos: deposito?.valorCentavos ?? 0, simulado: true },
    });

    return milestoneAtualizado;
  }

  /**
   * Liberação parcial (E4-10) — chamada pela resolução de disputa quando o
   * mediador decide `LIBERAR_PARCIAL`: libera parte do depósito pro
   * contratado (com comissão proporcional) e estorna o restante pro
   * cliente. Exige depósito confirmado e ainda não liberado.
   */
  async liberarParcial(
    contractId: string,
    milestoneId: string,
    valorLiberadoCentavos: number,
    requesterId: string,
  ): Promise<Milestone> {
    const deposito = await this.prisma.escrowTransaction.findFirst({
      where: { milestoneId, tipo: "DEPOSITO" },
    });
    if (!deposito) {
      throw new ConflictException("Esta etapa não tem depósito em custódia — não há valor pra liberar");
    }
    if (valorLiberadoCentavos > deposito.valorCentavos) {
      throw new ConflictException(
        "Valor de liberação parcial não pode ser maior que o valor depositado",
      );
    }

    const jaLiberado = await this.prisma.escrowTransaction.findFirst({
      where: { milestoneId, tipo: "LIBERACAO" },
    });
    if (jaLiberado) {
      throw new ConflictException("Esta etapa já teve uma liberação registrada");
    }

    const comissaoCentavos = Math.round(
      (valorLiberadoCentavos * env.ESCROW_COMMISSION_BPS) / 10_000,
    );
    const valorLiquidoCentavos = valorLiberadoCentavos - comissaoCentavos;
    const valorEstornadoCentavos = deposito.valorCentavos - valorLiberadoCentavos;

    const milestoneAtualizado = await this.prisma.$transaction(async (tx) => {
      await this.appendLedger(tx, {
        milestoneId,
        tipo: "LIBERACAO",
        valorCentavos: valorLiquidoCentavos,
        taxaPlataformaCentavos: comissaoCentavos,
        status: "CONFIRMADO",
      });
      await this.appendLedger(tx, {
        milestoneId,
        tipo: "COMISSAO",
        valorCentavos: comissaoCentavos,
        taxaPlataformaCentavos: null,
        status: "CONFIRMADO",
      });
      if (valorEstornadoCentavos > 0) {
        await this.appendLedger(tx, {
          milestoneId,
          tipo: "ESTORNO",
          valorCentavos: valorEstornadoCentavos,
          taxaPlataformaCentavos: null,
          status: "CONFIRMADO",
        });
      }
      return tx.milestone.update({ where: { id: milestoneId }, data: { status: "PAGO" } });
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "escrow.liberado_parcial",
      entidade: "escrow_transaction",
      payload: {
        milestoneId,
        valorLiquidoCentavos,
        comissaoCentavos,
        valorEstornadoCentavos,
        simulado: true,
      },
    });

    return milestoneAtualizado;
  }

  /** Ledger cru de um contrato — parte do contrato OU membro da equipe (só leitura). */
  async getLedger(requesterId: string, contractId: string): Promise<EscrowTransactionPublic[]> {
    await this.requirePartyOrTeamMember(contractId, requesterId);

    const transacoes = await this.prisma.escrowTransaction.findMany({
      where: { milestone: { contractId } },
      orderBy: { createdAt: "asc" },
    });
    return transacoes.map(toPublicEscrowTransaction);
  }

  /**
   * Extrato financeiro (E4-12) — todas as transações `LIBERACAO` dos
   * contratos em que o usuário é `CONTRATADO` (o que ele de fato recebeu),
   * com o contexto da etapa e `pspRef` como comprovante. Vazio pra quem
   * nunca foi contratado de nada (ex.: cliente puro) — sem exigir tipo de
   * usuário específico.
   */
  async getExtrato(userId: string): Promise<ExtratoFinanceiro> {
    const contratos = await this.prisma.contractParty.findMany({
      where: { userId, papel: "CONTRATADO" },
      select: { contractId: true },
    });
    const contractIds = contratos.map((c) => c.contractId);
    if (contractIds.length === 0) {
      return { totalRecebidoCentavos: 0, itens: [] };
    }

    const transacoes = await this.prisma.escrowTransaction.findMany({
      where: { tipo: "LIBERACAO", milestone: { contractId: { in: contractIds } } },
      include: { milestone: { select: { contractId: true, descricao: true } } },
      orderBy: { createdAt: "desc" },
    });

    const itens: ExtratoFinanceiroItem[] = transacoes.map((t) => ({
      id: t.id,
      contractId: t.milestone.contractId,
      milestoneId: t.milestoneId,
      milestoneDescricao: t.milestone.descricao,
      valorCentavos: t.valorCentavos,
      pspRef: t.pspRef,
      createdAt: t.createdAt.toISOString(),
    }));

    const totalRecebidoCentavos = itens.reduce((sum, i) => sum + i.valorCentavos, 0);

    return { totalRecebidoCentavos, itens };
  }

  /**
   * Encadeia o hash (E4-05): SHA-256 do payload + hash da transação
   * anterior. Lock global serializa a leitura do "último hash" contra
   * depósitos/liberações concorrentes de QUALQUER etapa — sem isso, duas
   * inserções paralelas poderiam ler o mesmo `previousHash` e quebrar a
   * cadeia (mesmo padrão de `pg_advisory_xact_lock` já usado em
   * `RfqProposalService.enforceMonthlyCap`, E3-05/P-028).
   */
  private async appendLedger(
    tx: Prisma.TransactionClient,
    data: AppendLedgerInput,
  ): Promise<EscrowTransaction> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('escrow_ledger'))`;

    const ultima = await tx.escrowTransaction.findFirst({ orderBy: { createdAt: "desc" } });
    const previousHash = ultima?.ledgerHash ?? null;
    const pspRef = `SIMULADO-${randomUUID()}`;

    const ledgerHash = createHash("sha256")
      .update(JSON.stringify({ ...data, pspRef, previousHash }))
      .digest("hex");

    return tx.escrowTransaction.create({
      data: { ...data, pspRef, previousHash, ledgerHash },
    });
  }

  /** Não vaza se o contrato existe e eu não sou parte dele — 404 nos dois casos. */
  private async requireRole(
    contractId: string,
    userId: string,
    role: ContractPartyRole,
  ): Promise<void> {
    const party = await this.prisma.contractParty.findUnique({
      where: { contractId_userId: { contractId, userId } },
    });
    if (!party) {
      throw new NotFoundException("Contrato não encontrado");
    }
    if (party.papel !== role) {
      throw new ForbiddenException(
        role === "CONTRATANTE" ? "Só o cliente pode fazer isso" : "Só o contratado pode fazer isso",
      );
    }
  }

  /** Leitura: parte do contrato OU membro da equipe da obra (mesmo padrão de MilestonesService, E6-04). */
  private async requirePartyOrTeamMember(contractId: string, userId: string): Promise<void> {
    const party = await this.prisma.contractParty.findUnique({
      where: { contractId_userId: { contractId, userId } },
    });
    if (party) {
      return;
    }

    const obraId = await this.getObraId(contractId);
    const membership = obraId
      ? await this.prisma.workTeamMember.findUnique({
          where: { obraId_userId: { obraId, userId } },
        })
      : null;
    if (!membership) {
      throw new NotFoundException("Contrato não encontrado");
    }
  }

  /** Não vaza se a etapa existe e é de outro contrato — 404 nos dois casos. */
  private async getOwnedOrThrow(contractId: string, milestoneId: string): Promise<Milestone> {
    const milestone = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.contractId !== contractId) {
      throw new NotFoundException("Etapa não encontrada");
    }
    return milestone;
  }

  private async getObraId(contractId: string): Promise<string | undefined> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { obraId: true },
    });
    return contract?.obraId;
  }
}
