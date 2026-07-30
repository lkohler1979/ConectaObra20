import { z } from "zod";

export const purchaseQuoteIdSchema = z.string().uuid();

/**
 * Cotação automática multi-fornecedor (E7-02) — o cliente não escolhe o
 * fornecedor, o sistema casa por `ProfileFornecedor.categorias` (mesmo
 * espírito do matching de RFQ, E3-03, mas sem geo/raio: entrega de material
 * não tem o mesmo modelo de atendimento presencial).
 */
export const purchaseQuoteItemPrecoSchema = z.object({
  descricao: z.string().trim().min(1),
  quantidade: z.number().positive(),
  unidade: z.string().trim().min(1),
  precoUnitarioCentavos: z.number().int().nonnegative(),
});
export type PurchaseQuoteItemPreco = z.infer<typeof purchaseQuoteItemPrecoSchema>;

export const respondPurchaseQuoteInputSchema = z.object({
  itensPrecos: z.array(purchaseQuoteItemPrecoSchema).min(1, "Informe o preço de pelo menos um item"),
  freteCentavos: z.number().int().nonnegative(),
  prazoDias: z.number().int().positive(),
});
export type RespondPurchaseQuoteInput = z.infer<typeof respondPurchaseQuoteInputSchema>;

export const purchaseQuoteStatusSchema = z.enum(["SOLICITADA", "RESPONDIDA"]);
export type PurchaseQuoteStatus = z.infer<typeof purchaseQuoteStatusSchema>;

export const purchaseQuotePublicSchema = z.object({
  id: z.string().uuid(),
  materialListId: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  fornecedorNome: z.string(),
  itensPrecos: z.array(purchaseQuoteItemPrecoSchema),
  freteCentavos: z.number().int().nullable(),
  prazoDias: z.number().int().nullable(),
  status: purchaseQuoteStatusSchema,
  createdAt: z.string(),
});
export type PurchaseQuotePublic = z.infer<typeof purchaseQuotePublicSchema>;
