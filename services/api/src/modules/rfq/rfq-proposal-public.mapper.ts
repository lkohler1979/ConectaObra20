import type { RfqProposal } from "@prisma/client";
import type { RfqProposalPublic } from "@conectaobra/types/rfq-proposals";

export function toPublicRfqProposal(proposal: RfqProposal): RfqProposalPublic {
  return {
    id: proposal.id,
    rfqId: proposal.rfqId,
    proponenteId: proposal.proponenteId,
    precoCentavos: proposal.precoCentavos,
    prazoDias: proposal.prazoDias,
    observacoes: proposal.observacoes,
    status: proposal.status,
    createdAt: proposal.createdAt.toISOString(),
  };
}
