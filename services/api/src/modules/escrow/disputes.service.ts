import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Milestone } from "@prisma/client";
import type {
  AbrirDisputeInput,
  AdminDispute,
  DisputePublic,
  ResolverDisputeInput,
} from "@conectaobra/types/disputes";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { EscrowService } from "./escrow.service";
import { toAdminDispute, toPublicDispute } from "./dispute-public.mapper";

/**
 * Fluxo de disputa (E4-09) — abertura por qualquer parte do contrato,
 * mediação exclusiva do ADMIN. Abrir uma disputa marca a etapa
 * `EM_DISPUTA`, o que já bloqueia iniciar/entregar/aprovar sozinho (os
 * guards de status de `MilestonesService` não casam com `EM_DISPUTA`) —
 * "disputa congela liberação imediatamente" (checklist B.3). Resolução
 * financeira (estorno/liberação parcial, E4-10) delega pro `EscrowService`.
 */
@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly escrowService: EscrowService,
  ) {}

  async abrir(
    requesterId: string,
    contractId: string,
    milestoneId: string,
    input: AbrirDisputeInput,
  ): Promise<DisputePublic> {
    await this.requireParty(contractId, requesterId);
    const milestone = await this.getOwnedOrThrow(contractId, milestoneId);

    if (milestone.status === "EM_DISPUTA") {
      throw new ConflictException("Esta etapa já tem uma disputa em aberto");
    }
    if (milestone.status === "PAGO") {
      throw new ConflictException("Esta etapa já foi paga — não é possível abrir disputa");
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          milestoneId,
          abertoPorId: requesterId,
          motivo: input.motivo,
          evidencias: input.evidencias,
          status: "ABERTA",
        },
      });
      await tx.milestone.update({ where: { id: milestoneId }, data: { status: "EM_DISPUTA" } });
      return created;
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "dispute.aberta",
      entidade: "dispute",
      payload: { disputeId: dispute.id, milestoneId },
    });

    return toPublicDispute(dispute);
  }

  /** Dono do contrato (qualquer papel) OU membro da equipe (só leitura). */
  async listForMilestone(
    requesterId: string,
    contractId: string,
    milestoneId: string,
  ): Promise<DisputePublic[]> {
    await this.requirePartyOrTeamMember(contractId, requesterId);
    await this.getOwnedOrThrow(contractId, milestoneId);

    const disputes = await this.prisma.dispute.findMany({
      where: { milestoneId },
      orderBy: { createdAt: "desc" },
    });
    return disputes.map(toPublicDispute);
  }

  /**
   * Fila de mediação (ADMIN) — todas as disputas ainda abertas, com o
   * contexto necessário pra decidir (obra, etapa, valor, quem abriu).
   */
  async listAbertas(): Promise<AdminDispute[]> {
    const disputes = await this.prisma.dispute.findMany({
      where: { status: "ABERTA" },
      orderBy: { createdAt: "asc" },
      include: {
        milestone: { include: { contract: { include: { obra: true } } } },
        abertoPor: true,
      },
    });
    return disputes.map(toAdminDispute);
  }

  async resolver(
    mediadorId: string,
    disputeId: string,
    input: ResolverDisputeInput,
  ): Promise<DisputePublic> {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException("Disputa não encontrada");
    }
    if (dispute.status !== "ABERTA") {
      throw new ConflictException("Esta disputa já foi resolvida");
    }

    const milestone = await this.prisma.milestone.findUniqueOrThrow({
      where: { id: dispute.milestoneId },
    });

    if (input.decisao === "APROVAR") {
      await this.prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: "ENTREGUE" },
      });
    } else if (input.decisao === "ESTORNAR") {
      await this.escrowService.estornarDeposito(milestone.contractId, milestone.id, mediadorId);
    } else {
      await this.escrowService.liberarParcial(
        milestone.contractId,
        milestone.id,
        input.valorLiberadoCentavos as number,
        mediadorId,
      );
    }

    const resolved = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { mediadorId, resolucao: input.resolucao, status: "RESOLVIDA" },
    });

    await this.auditLog.record({
      userId: mediadorId,
      obraId: await this.getObraId(milestone.contractId),
      acao: "dispute.resolvida",
      entidade: "dispute",
      payload: { disputeId, decisao: input.decisao, milestoneId: milestone.id },
    });

    return toPublicDispute(resolved);
  }

  /** Não vaza se o contrato existe e eu não sou parte dele — 404 nos dois casos. */
  private async requireParty(contractId: string, userId: string): Promise<void> {
    const party = await this.prisma.contractParty.findUnique({
      where: { contractId_userId: { contractId, userId } },
    });
    if (!party) {
      throw new NotFoundException("Contrato não encontrado");
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
