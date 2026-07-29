import { z } from "zod";
import { milestoneStatusSchema } from "./milestones";

/**
 * Painel financeiro da obra (E6-02): previsto × aprovado por etapa.
 * Deliberadamente "aprovado", não "realizado"/"pago" — sem o escrow (E4,
 * bloqueado por P-002), nenhum dinheiro de verdade se move ainda; isto só
 * reflete o que já foi entregue e aprovado (`Milestone.status`), não um
 * pagamento de fato.
 */
export const etapaFinanceiraSchema = z.object({
  milestoneId: z.string().uuid(),
  contractId: z.string().uuid(),
  descricao: z.string(),
  status: milestoneStatusSchema,
  valorPrevistoCentavos: z.number().int(),
  valorAprovadoCentavos: z.number().int(),
});
export type EtapaFinanceira = z.infer<typeof etapaFinanceiraSchema>;

export const painelFinanceiroObraSchema = z.object({
  obraId: z.string().uuid(),
  orcamentoPrevistoCentavos: z.number().int().nullable(),
  totalEtapasCentavos: z.number().int(),
  totalAprovadoCentavos: z.number().int(),
  etapas: z.array(etapaFinanceiraSchema),
});
export type PainelFinanceiroObra = z.infer<typeof painelFinanceiroObraSchema>;
