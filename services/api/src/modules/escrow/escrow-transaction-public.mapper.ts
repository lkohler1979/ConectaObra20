import type { EscrowTransaction } from "@prisma/client";
import type { EscrowTransactionPublic } from "@conectaobra/types/escrow";

export function toPublicEscrowTransaction(transacao: EscrowTransaction): EscrowTransactionPublic {
  return {
    id: transacao.id,
    milestoneId: transacao.milestoneId,
    pspRef: transacao.pspRef,
    tipo: transacao.tipo,
    valorCentavos: transacao.valorCentavos,
    taxaPlataformaCentavos: transacao.taxaPlataformaCentavos,
    status: transacao.status,
    ledgerHash: transacao.ledgerHash,
    previousHash: transacao.previousHash,
    createdAt: transacao.createdAt.toISOString(),
  };
}
