import type { AvgCost } from "@prisma/client";
import type { AvgCostPublic } from "@conectaobra/types/ai-budget";

export function toPublicAvgCost(avgCost: AvgCost): AvgCostPublic {
  return {
    id: avgCost.id,
    servico: avgCost.servico,
    cidade: avgCost.cidade,
    unidade: avgCost.unidade,
    valorMinCentavos: avgCost.valorMinCentavos,
    valorMedCentavos: avgCost.valorMedCentavos,
    valorMaxCentavos: avgCost.valorMaxCentavos,
    mes: avgCost.mes.toISOString(),
  };
}
