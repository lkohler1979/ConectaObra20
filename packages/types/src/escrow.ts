import { z } from "zod";

/**
 * Ledger de escrow (E4) — PSP **simulado**, sempre sucesso (P-002 em
 * aberto, ver PENDENCIAS.md). Depósito e liberação são instantâneos;
 * `ledgerHash`/`previousHash` encadeiam as transações (E4-05) mesmo sem
 * um PSP real por trás emitindo os eventos.
 */
export const escrowTransactionTypeSchema = z.enum(["DEPOSITO", "LIBERACAO", "ESTORNO", "COMISSAO"]);
export type EscrowTransactionType = z.infer<typeof escrowTransactionTypeSchema>;

export const escrowTransactionPublicSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  pspRef: z.string(),
  tipo: escrowTransactionTypeSchema,
  valorCentavos: z.number().int(),
  taxaPlataformaCentavos: z.number().int().nullable(),
  status: z.string(),
  ledgerHash: z.string(),
  previousHash: z.string().nullable(),
  createdAt: z.string(),
});
export type EscrowTransactionPublic = z.infer<typeof escrowTransactionPublicSchema>;
