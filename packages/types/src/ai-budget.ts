import { z } from "zod";

/**
 * Análise de orçamento (E5-05) — compara um valor proposto com o custo
 * médio regional (`AvgCost`, schema desde S0-05). Comparação puramente
 * determinística (min/max da faixa) — CLAUDE.md §5 regra 3: cálculos
 * quantitativos usam código, nunca o LLM "achando" se o preço é justo.
 */
export const upsertAvgCostInputSchema = z.object({
  servico: z.string().trim().min(1).max(150),
  cidade: z.string().trim().min(1).max(150),
  unidade: z.string().trim().min(1).max(30),
  valorMinCentavos: z.number().int().nonnegative(),
  valorMedCentavos: z.number().int().nonnegative(),
  valorMaxCentavos: z.number().int().nonnegative(),
  mes: z.coerce.date(),
});
export type UpsertAvgCostInput = z.infer<typeof upsertAvgCostInputSchema>;

export const avgCostPublicSchema = z.object({
  id: z.string().uuid(),
  servico: z.string(),
  cidade: z.string(),
  unidade: z.string(),
  valorMinCentavos: z.number().int(),
  valorMedCentavos: z.number().int(),
  valorMaxCentavos: z.number().int(),
  mes: z.string(),
});
export type AvgCostPublic = z.infer<typeof avgCostPublicSchema>;

export const analisarOrcamentoInputSchema = z.object({
  servico: z.string().trim().min(1).max(150),
  cidade: z.string().trim().min(1).max(150),
  valorPropostoCentavos: z.number().int().positive(),
});
export type AnalisarOrcamentoInput = z.infer<typeof analisarOrcamentoInputSchema>;

export const classificacaoOrcamentoSchema = z.enum([
  "ABAIXO_DA_MEDIA",
  "DENTRO_DA_MEDIA",
  "ACIMA_DA_MEDIA",
]);
export type ClassificacaoOrcamento = z.infer<typeof classificacaoOrcamentoSchema>;

export const analiseOrcamentoOutputSchema = z.object({
  servico: z.string(),
  cidade: z.string(),
  valorPropostoCentavos: z.number().int(),
  custoMedioRegional: avgCostPublicSchema.nullable(),
  classificacao: classificacaoOrcamentoSchema.nullable(),
  percentualDesvioDaMedia: z.number().nullable(),
  mensagem: z.string(),
});
export type AnaliseOrcamentoOutput = z.infer<typeof analiseOrcamentoOutputSchema>;
