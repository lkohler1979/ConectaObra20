import type { Dispute } from "@prisma/client";
import type { DisputePublic, DisputeStatus } from "@conectaobra/types/disputes";

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
