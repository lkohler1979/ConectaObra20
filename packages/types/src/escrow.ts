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

/**
 * Extrato financeiro do prestador/fornecedor (E4-12) — só transações
 * `LIBERACAO` dos contratos em que o usuário é `CONTRATADO` (o que ele de
 * fato recebeu). `pspRef` funciona como comprovante da transação simulada.
 */
export const extratoFinanceiroItemSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  milestoneDescricao: z.string(),
  valorCentavos: z.number().int(),
  pspRef: z.string(),
  createdAt: z.string(),
});
export type ExtratoFinanceiroItem = z.infer<typeof extratoFinanceiroItemSchema>;

export const extratoFinanceiroSchema = z.object({
  totalRecebidoCentavos: z.number().int(),
  itens: z.array(extratoFinanceiroItemSchema),
});
export type ExtratoFinanceiro = z.infer<typeof extratoFinanceiroSchema>;
