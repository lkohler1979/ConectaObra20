import type { Contract } from "@prisma/client";
import type { ContractPublic } from "@conectaobra/types/contracts";

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
