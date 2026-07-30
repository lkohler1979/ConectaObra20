import type { PurchaseOrder, PurchaseQuote } from "@prisma/client";
import type { PurchaseOrderPublic, PurchaseOrderStatus } from "@conectaobra/types/purchase-orders";

type QuoteWithFornecedor = PurchaseQuote & {
  fornecedor: { user: { nome: string } };
};

export function toPublicPurchaseOrder(
  order: PurchaseOrder,
  quote: QuoteWithFornecedor,
): PurchaseOrderPublic {
  return {
    id: order.id,
    purchaseQuoteId: order.purchaseQuoteId,
    materialListId: quote.materialListId,
    fornecedorId: quote.fornecedorId,
    fornecedorNome: quote.fornecedor.user.nome,
    itensTotalCentavos: order.itensTotalCentavos,
    freteCentavos: order.freteCentavos,
    comissaoCentavos: order.comissaoCentavos,
    totalPagoCentavos: order.totalPagoCentavos,
    pspRef: order.pspRef,
    status: order.status as PurchaseOrderStatus,
    createdAt: order.createdAt.toISOString(),
  };
}
