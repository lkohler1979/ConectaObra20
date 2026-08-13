import type { Rfq, RfqProposal } from "@prisma/client";
import type { RfqProposalMine, RfqProposalPublic } from "@conectaobra/types/rfq-proposals";

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
    anexos: proposal.anexos,
    status: proposal.status,
    createdAt: proposal.createdAt.toISOString(),
  };
}

type RfqProposalMineRow = RfqProposalWithProponente & { rfq: Rfq & { obra: { titulo: string } } };

export function toMineRfqProposal(proposal: RfqProposalMineRow): RfqProposalMine {
  return {
    ...toPublicRfqProposal(proposal),
    rfqCategoria: proposal.rfq.categoria,
    rfqStatus: proposal.rfq.status,
    obraTitulo: proposal.rfq.obra.titulo,
  };
}
