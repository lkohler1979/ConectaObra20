import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ContractParty, type ContractPartyRole, type Milestone } from "@prisma/client";
import type {
  CreateMilestoneInput,
  EntregarMilestoneInput,
  MilestonePublic,
} from "@conectaobra/types/milestones";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicMilestone } from "./milestone-public.mapper";

/**
 * Cronograma de etapas (E6-01) — segue o loop central do CLAUDE.md:
 * CONTRATANTE (cliente) define e aprova etapas; CONTRATADO (prestador/
 * fornecedor) executa e entrega evidências. Sem Gantt/dependências entre
 * etapas (não modelado); sem liberação de escrow (E4, bloqueado por P-002)
 * — "aprovar" aqui só marca o status, não movimenta dinheiro.
 */
@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
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
    await this.requireParty(contractId, requesterId);

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
      data: { status: "ENTREGUE", fotos: input.fotos },
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "milestone.entregue",
      entidade: "milestone",
      payload: { milestoneId, quantidadeFotos: input.fotos.length },
    });

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

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "APROVADO", aprovadoEm: new Date(), aprovadoPorId: requesterId },
    });

    await this.auditLog.record({
      userId: requesterId,
      obraId: await this.getObraId(contractId),
      acao: "milestone.aprovado",
      entidade: "milestone",
      payload: { milestoneId },
    });

    return toPublicMilestone(updated);
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
