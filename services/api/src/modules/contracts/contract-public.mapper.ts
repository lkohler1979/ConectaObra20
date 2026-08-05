import type { Contract, ContractPartyRole, Work } from "@prisma/client";
import type { ContractListItem, ContractPublic } from "@conectaobra/types/contracts";

export function toPublicContract(contract: Contract): ContractPublic {
  return {
    id: contract.id,
    rfqProposalId: contract.rfqProposalId,
    obraId: contract.obraId,
    valorTotalCentavos: contract.valorTotalCentavos,
    status: contract.status,
    pdfUrl: contract.pdfUrl,
    createdAt: contract.createdAt.toISOString(),
  };
}

export function toContractListItem(
  contract: Contract & { obra: Work },
  meuPapel: ContractPartyRole,
): ContractListItem {
  return {
    ...toPublicContract(contract),
    obraTitulo: contract.obra.titulo,
    meuPapel,
  };
}
