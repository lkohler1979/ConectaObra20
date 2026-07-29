import type { Product } from "@prisma/client";
import type { ProductPublic } from "@conectaobra/types/catalog";

export function toPublicProduct(product: Product): ProductPublic {
  return {
    id: product.id,
    fornecedorId: product.fornecedorId,
    nome: product.nome,
    categoria: product.categoria,
    precoCentavos: product.precoCentavos,
    unidade: product.unidade,
    estoque: product.estoque,
    fotos: product.fotos,
    createdAt: product.createdAt.toISOString(),
  };
}
