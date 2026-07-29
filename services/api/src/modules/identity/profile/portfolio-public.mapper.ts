import type { PortfolioItem } from "@prisma/client";
import type { PortfolioItemPublic } from "@conectaobra/types/portfolio";

export function toPublicPortfolioItem(item: PortfolioItem): PortfolioItemPublic {
  return {
    id: item.id,
    prestadorId: item.prestadorId,
    titulo: item.titulo,
    descricao: item.descricao,
    fotos: item.fotos,
    createdAt: item.createdAt.toISOString(),
  };
}
