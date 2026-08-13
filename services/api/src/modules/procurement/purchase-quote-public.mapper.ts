import type { PurchaseQuote } from "@prisma/client";
import type { MaterialListItem } from "@conectaobra/types/material-lists";
import type {
  PurchaseQuoteItemPreco,
  PurchaseQuotePublic,
  PurchaseQuoteStatus,
} from "@conectaobra/types/purchase-quotes";

type PurchaseQuoteWithFornecedor = PurchaseQuote & {
  fornecedor: { user: { nome: string } };
  purchaseOrder?: { id: string } | null;
  materialList?: { itens: unknown } | null;
};

export function toPublicPurchaseQuote(quote: PurchaseQuoteWithFornecedor): PurchaseQuotePublic {
  return {
    id: quote.id,
    materialListId: quote.materialListId,
    fornecedorId: quote.fornecedorId,
    fornecedorNome: quote.fornecedor.user.nome,
    itensPrecos: quote.itensPrecos as unknown as PurchaseQuoteItemPreco[],
    freteCentavos: quote.freteCentavos,
    prazoDias: quote.prazoDias,
    status: quote.status as PurchaseQuoteStatus,
    createdAt: quote.createdAt.toISOString(),
    materialListItens: (quote.materialList?.itens as unknown as MaterialListItem[]) ?? [],
    pedidoFechado: Boolean(quote.purchaseOrder),
  };
}
