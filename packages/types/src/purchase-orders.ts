import { z } from "zod";

/**
 * Checkout de compra (E7-04) — PSP **simulado**, sempre sucesso. Não há
 * integração real com PSP/BaaS até P-002 ser resolvido (ver PENDENCIAS.md);
 * `pspRef` é sempre um valor sintético (`SIMULADO-<uuid>`).
 */
export const purchaseOrderStatusSchema = z.enum(["PAGO"]);
export type PurchaseOrderStatus = z.infer<typeof purchaseOrderStatusSchema>;

export const purchaseOrderPublicSchema = z.object({
  id: z.string().uuid(),
  purchaseQuoteId: z.string().uuid(),
  materialListId: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  fornecedorNome: z.string(),
  itensTotalCentavos: z.number().int(),
  freteCentavos: z.number().int(),
  comissaoCentavos: z.number().int(),
  totalPagoCentavos: z.number().int(),
  pspRef: z.string(),
  status: purchaseOrderStatusSchema,
  createdAt: z.string(),
});
export type PurchaseOrderPublic = z.infer<typeof purchaseOrderPublicSchema>;
