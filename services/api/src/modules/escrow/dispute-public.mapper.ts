import type { Dispute, Milestone, User, Work } from "@prisma/client";
import type { AdminDispute, DisputePublic, DisputeStatus } from "@conectaobra/types/disputes";

export function toPublicDispute(dispute: Dispute): DisputePublic {
  return {
    id: dispute.id,
    milestoneId: dispute.milestoneId,
    abertoPorId: dispute.abertoPorId,
    motivo: dispute.motivo,
    evidencias: dispute.evidencias,
    mediadorId: dispute.mediadorId,
    resolucao: dispute.resolucao,
    status: dispute.status as DisputeStatus,
    createdAt: dispute.createdAt.toISOString(),
  };
}

type DisputeWithContext = Dispute & {
  milestone: Milestone & { contract: { obra: Work } };
  abertoPor: User;
};

export function toAdminDispute(dispute: DisputeWithContext): AdminDispute {
  return {
    ...toPublicDispute(dispute),
    obraId: dispute.milestone.contract.obra.id,
    obraTitulo: dispute.milestone.contract.obra.titulo,
    milestoneDescricao: dispute.milestone.descricao,
    milestoneValorCentavos: dispute.milestone.valorCentavos,
    abertoPorNome: dispute.abertoPor.nome,
  };
}
