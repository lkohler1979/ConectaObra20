import type { Indicator } from "@prisma/client";
import type { IndicatorPublic } from "@conectaobra/types/indicators";

export function toPublicIndicator(indicator: Indicator): IndicatorPublic {
  return {
    id: indicator.id,
    tipo: indicator.tipo,
    regiao: indicator.regiao,
    valorCentavos: indicator.valorCentavos,
    referenciaMes: indicator.referenciaMes.toISOString(),
    fonte: indicator.fonte,
  };
}
