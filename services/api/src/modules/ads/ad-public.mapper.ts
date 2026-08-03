import type { Ad } from "@prisma/client";
import { adCriativoSchema, type AdPrivate } from "@conectaobra/types/ads";

export function toPrivateAd(ad: Ad): AdPrivate {
  return {
    id: ad.id,
    anuncianteId: ad.anuncianteId,
    tipo: ad.tipo,
    criativo: adCriativoSchema.parse(ad.criativo),
    budgetCentavos: ad.budgetCentavos,
    ativo: ad.ativo,
    createdAt: ad.createdAt.toISOString(),
  };
}
