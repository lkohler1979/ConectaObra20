import type { RfqProposal } from "@prisma/client";
import type { RfqProposalPublic } from "@conectaobra/types/rfq-proposals";

type RfqProposalWithProponente = RfqProposal & { proponente: { nome: string } };

export function toPublicRfqProposal(proposal: RfqProposalWithProponente): RfqProposalPublic {
  return {
    id: proposal.id,
    rfqId: proposal.rfqId,
    proponenteId: proposal.proponenteId,
    proponenteNome: proposal.proponente.nome,
    precoCentavos: proposal.precoCentavos,
    prazoDias: proposal.prazoDias,
    observacoes: proposal.observacoes,
    status: proposal.status,
    createdAt: proposal.createdAt.toISOString(),
  };
}
