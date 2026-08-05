import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ContractParty, type ContractPartyRole, type Milestone } from "@prisma/client";
import type {
  CreateMilestoneInput,
  EntregarMilestoneInput,
  MilestonePublic,
} from "@conectaobra/types/milestones";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { EscrowService } from "../escrow/escrow.service";
import { MilestoneTimeoutService } from "./milestone-timeout.service";
import { toPublicMilestone } from "./milestone-public.mapper";

/**
 * Cronograma de etapas (E6-01) — segue o loop central do CLAUDE.md:
 * CONTRATANTE (cliente) define e aprova etapas; CONTRATADO (prestador/
 * fornecedor) executa e entrega evidências. Sem Gantt/dependências entre
 * etapas (não modelado). Escrow (E4) é PSP **simulado**, ver
 * `EscrowService` — `aprovar()` libera automaticamente quando a etapa teve
 * depósito prévio; sem depósito, continua só marcando `APROVADO` (opt-in,
 * retrocompatível).
 */
@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly analytics: AnalyticsService,
    private readonly escrowService: EscrowService,
    private readonly milestoneTimeoutService: MilestoneTimeoutService,
  ) {}

  async create(
    contractId: string,
    requesterId: string,
    input: CreateMilestoneInput,
  ): Promise<MilestonePublic> {
    await this.requireRole(contractId, requesterId, "CONTRATANTE");

    let milestone: Milestone;
    try {
      milestone = await this.prisma.milestone.create({
        data: {
          contractId,
          ordem: input.ordem,
          descricao: input.descricao,
          valorCentavos: input.valorCentavos,
          checklist: input.checklist,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe uma etapa com essa ordem para este contrato");
      }
      throw err;
    }

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "milestone.created",
      entidade: "milestone",
      payload: { milestoneId: milestone.id, contractId, ordem: milestone.ordem },
    });

    return toPublicMilestone(milestone);
  }

  async listForContract(contractId: string, requesterId: string): Promise<MilestonePublic[]> {
    await this.requirePartyOrTeamMember(contractId, requesterId);

    const milestones = await this.prisma.milestone.findMany({
      where: { contractId },
      orderBy: { ordem: "asc" },
    });
    return milestones.map(toPublicMilestone);
  }

  async iniciar(
    contractId: string,
    milestoneId: string,
    requesterId: string,
  ): Promise<MilestonePublic> {
    await this.requireRole(contractId, requesterId, "CONTRATADO");
    const milestone = await this.getOwnedOrThrow(contractId, milestoneId);

    if (milestone.status !== "PENDENTE") {
      throw new ConflictException("Etapa não está pendente");
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "EM_EXECUCAO" },
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "milestone.iniciado",
      entidade: "milestone",
      payload: { milestoneId },
    });

    return toPublicMilestone(updated);
  }

  async entregar(
    contractId: string,
    milestoneId: string,
    requesterId: string,
    input: EntregarMilestoneInput,
  ): Promise<MilestonePublic> {
    await this.requireRole(contractId, requesterId, "CONTRATADO");
    const milestone = await this.getOwnedOrThrow(contractId, milestoneId);

    if (milestone.status !== "PENDENTE" && milestone.status !== "EM_EXECUCAO") {
      throw new ConflictException("Etapa não pode ser entregue neste estado");
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "ENTREGUE", fotos: input.fotos, entregueEm: new Date() },
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "milestone.entregue",
      entidade: "milestone",
      payload: { milestoneId, quantidadeFotos: input.fotos.length },
    });

    await this.milestoneTimeoutService.scheduleTimeout(contractId, milestoneId);

    return toPublicMilestone(updated);
  }

  async aprovar(
    contractId: string,
    milestoneId: string,
    requesterId: string,
  ): Promise<MilestonePublic> {
    await this.requireRole(contractId, requesterId, "CONTRATANTE");
    const milestone = await this.getOwnedOrThrow(contractId, milestoneId);

    if (milestone.status !== "ENTREGUE") {
      throw new ConflictException("Etapa precisa estar entregue pra ser aprovada");
    }

    const updated = await this.finalizarAprovacao(
      contractId,
      milestoneId,
      requesterId,
      "milestone.aprovado",
    );

    return toPublicMilestone(updated);
  }

  /**
   * Aprovação automática (E4-08) — chamada pelo job de timeout quando o
   * cliente não responde em `MILESTONE_AUTO_APROVACAO_DIAS`. Relê o status
   * atual antes de agir: se a etapa já saiu de `ENTREGUE` (aprovada
   * manualmente, disputada), é um no-op — o job não precisa ser cancelado
   * explicitamente. `aprovadoPorId` registra o CONTRATANTE mesmo sem ação
   * dele, já que a aprovação automática age em nome dele por omissão.
   */
  async aprovarAutomaticamente(contractId: string, milestoneId: string): Promise<void> {
    const milestone = await this.getOwnedOrThrow(contractId, milestoneId);
    if (milestone.status !== "ENTREGUE") {
      return;
    }

    const contratante = await this.prisma.contractParty.findFirst({
      where: { contractId, papel: "CONTRATANTE" },
    });
    if (!contratante) {
      return;
    }

    await this.finalizarAprovacao(
      contractId,
      milestoneId,
      contratante.userId,
      "milestone.aprovado_automaticamente",
    );
  }

  /** Compartilhado por `aprovar()` e `aprovarAutomaticamente()` — marca APROVADO e libera o escrow se houver depósito. */
  private async finalizarAprovacao(
    contractId: string,
    milestoneId: string,
    aprovadoPorId: string,
    acao: string,
  ): Promise<Milestone> {
    let updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "APROVADO", aprovadoEm: new Date(), aprovadoPorId },
    });

    await this.auditLog.record({
      userId: aprovadoPorId,
      obraId: await this.getObraId(contractId),
      acao,
      entidade: "milestone",
      payload: { milestoneId },
    });

    const liberado = await this.escrowService.liberarSeDepositado(
      contractId,
      milestoneId,
      aprovadoPorId,
    );
    if (liberado) {
      updated = liberado;
      // North Star do produto (GMV transacionado via escrow, 01_PRD §3) —
      // o único evento que representa dinheiro de fato liberado (simulado).
      this.analytics.capture(aprovadoPorId, "milestone_paid", {
        contractId,
        milestoneId,
        valorCentavos: liberado.valorCentavos,
      });
    }

    return updated;
  }

  /** Não vaza se o contrato existe e eu não sou parte dele — 404 nos dois casos. */
  private async requireParty(contractId: string, userId: string): Promise<ContractParty> {
    const party = await this.prisma.contractParty.findUnique({
      where: { contractId_userId: { contractId, userId } },
    });
    if (!party) {
      throw new NotFoundException("Contrato não encontrado");
    }
    return party;
  }

  /**
   * Leitura (E6-04): parte do contrato OU membro da equipe da obra (só
   * leitura, via WorkTeamMember). Ações de escrita continuam exclusivas de
   * `requireRole`/`requireParty` — equipe nunca cria/inicia/entrega/aprova.
   */
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

  private async requireRole(
    contractId: string,
    userId: string,
    role: ContractPartyRole,
  ): Promise<void> {
    const party = await this.requireParty(contractId, userId);
    if (party.papel !== role) {
      throw new ForbiddenException(
        role === "CONTRATANTE" ? "Só o cliente pode fazer isso" : "Só o contratado pode fazer isso",
      );
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

  /** Alimenta o diário de obra (E6-03) — Milestone não tem obraId direto, só via Contract. */
  private async getObraId(contractId: string): Promise<string | undefined> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { obraId: true },
    });
    return contract?.obraId;
  }
}
