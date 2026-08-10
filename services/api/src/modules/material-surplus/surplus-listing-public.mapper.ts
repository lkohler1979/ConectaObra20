import type { SurplusListing, SurplusOrder } from "@prisma/client";
import type {
  SurplusListingOwner,
  SurplusListingPublic,
  SurplusOrderPublic,
} from "@conectaobra/types/material-surplus";

type ListingWithCliente = SurplusListing & { cliente: { nome: string } };
type ListingWithOrder = ListingWithCliente & { order: SurplusOrder | null };

export function toPublicSurplusListing(listing: ListingWithCliente): SurplusListingPublic {
  return {
    id: listing.id,
    workId: listing.workId,
    clienteId: listing.clienteId,
    clienteNome: listing.cliente.nome,
    nome: listing.nome,
    descricao: listing.descricao,
    categoria: listing.categoria,
    quantidade: Number(listing.quantidade),
    unidade: listing.unidade,
    precoCentavos: listing.precoCentavos,
    fotos: listing.fotos,
    status: listing.status,
    createdAt: listing.createdAt.toISOString(),
  };
}

/** Visto só pelo dono — inclui dados do comprador se o item já foi vendido. */
export function toOwnerSurplusListing(listing: ListingWithOrder): SurplusListingOwner {
  return {
    ...toPublicSurplusListing(listing),
    order: listing.order
      ? {
          compradorNome: listing.order.compradorNome,
          compradorEmail: listing.order.compradorEmail,
          compradorTelefone: listing.order.compradorTelefone,
          createdAt: listing.order.createdAt.toISOString(),
        }
      : null,
  };
}

export function toPublicSurplusOrder(order: SurplusOrder): SurplusOrderPublic {
  return {
    id: order.id,
    surplusListingId: order.surplusListingId,
    itemPrecoCentavos: order.itemPrecoCentavos,
    comissaoCentavos: order.comissaoCentavos,
    totalPagoCentavos: order.totalPagoCentavos,
    pspRef: order.pspRef,
    status: order.status as "PAGO",
    createdAt: order.createdAt.toISOString(),
  };
}
