import type { Milestone } from "@prisma/client";
import type { MilestonePublic } from "@conectaobra/types/milestones";

export function toPublicMilestone(milestone: Milestone): MilestonePublic {
  return {
    id: milestone.id,
    contractId: milestone.contractId,
    ordem: milestone.ordem,
    descricao: milestone.descricao,
    valorCentavos: milestone.valorCentavos,
    checklist: Array.isArray(milestone.checklist) ? (milestone.checklist as string[]) : [],
    fotos: milestone.fotos,
    status: milestone.status,
    entregueEm: milestone.entregueEm ? milestone.entregueEm.toISOString() : null,
    aprovadoEm: milestone.aprovadoEm ? milestone.aprovadoEm.toISOString() : null,
    aprovadoPorId: milestone.aprovadoPorId,
    createdAt: milestone.createdAt.toISOString(),
  };
}
