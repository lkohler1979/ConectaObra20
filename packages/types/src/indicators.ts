import { z } from "zod";

/**
 * Indicadores de mercado (E9-02, CUB/INCC/SINAPI/aço/cimento/madeira) —
 * model `Indicator` existe desde S0-05, sem endpoints. Cadastro manual do
 * ADMIN (confirmado com o usuário via `AskUserQuestion`) — sem ingestão
 * automática de fonte externa, mesma categoria de decisão do PSP (P-002).
 */
export const indicatorTipoSchema = z.enum([
  "CUB",
  "CUB_DESONERADO",
  "INCC",
  "SINAPI",
  "ACO",
  "CIMENTO",
  "MADEIRA",
]);
export type IndicatorTipo = z.infer<typeof indicatorTipoSchema>;

export const upsertIndicatorInputSchema = z.object({
  tipo: indicatorTipoSchema,
  regiao: z.string().trim().min(1, "Região obrigatória").max(150),
  valorCentavos: z.number().int().positive(),
  referenciaMes: z.coerce.date(),
  fonte: z.string().trim().min(1, "Fonte obrigatória").max(200),
});
export type UpsertIndicatorInput = z.infer<typeof upsertIndicatorInputSchema>;

export const indicatorPublicSchema = z.object({
  id: z.string().uuid(),
  tipo: indicatorTipoSchema,
  regiao: z.string(),
  valorCentavos: z.number().int(),
  referenciaMes: z.string(),
  fonte: z.string(),
});
export type IndicatorPublic = z.infer<typeof indicatorPublicSchema>;

export const listPublicIndicatorsQuerySchema = z.object({
  tipo: indicatorTipoSchema.optional(),
  regiao: z.string().trim().min(1).max(150).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListPublicIndicatorsQuery = z.infer<typeof listPublicIndicatorsQuerySchema>;
