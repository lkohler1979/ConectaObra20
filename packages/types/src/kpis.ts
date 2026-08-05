import { z } from "zod";

/**
 * Dashboard de KPIs do PRD (E10-03, `01_PRD_ConectaObra_2.0.md` §3) —
 * calculado direto do Postgres (determinístico, CLAUDE.md §5 regra 3), sem
 * depender do PostHog (esse é só para o funil comportamental — ver
 * `AnalyticsService`). Todos os 6 objetivos/KPIs da tabela do PRD.
 */
export const kpiLiquidezSchema = z.object({
  percentualRespondidoEm24h: z.number(),
  totalRfqsConsiderados: z.number().int(),
});
export type KpiLiquidez = z.infer<typeof kpiLiquidezSchema>;

export const kpiConfiancaSchema = z.object({
  disputasPorTransacao: z.number(),
  totalDisputas: z.number().int(),
  totalTransacoes: z.number().int(),
});
export type KpiConfianca = z.infer<typeof kpiConfiancaSchema>;

export const kpiReceitaSchema = z.object({
  mrrCentavos: z.number().int(),
  totalAssinaturasAtivas: z.number().int(),
});
export type KpiReceita = z.infer<typeof kpiReceitaSchema>;

export const kpiAdocaoIaSchema = z.object({
  percentualClientesAtivosComIa: z.number(),
  totalClientes: z.number().int(),
  totalClientesComTresPerguntasSemana: z.number().int(),
});
export type KpiAdocaoIa = z.infer<typeof kpiAdocaoIaSchema>;

export const kpiChurnSchema = z.object({
  churnMensalPercentual: z.number().nullable(),
});
export type KpiChurn = z.infer<typeof kpiChurnSchema>;

export const kpiAtivacaoSchema = z.object({
  percentualAtivadoEm7Dias: z.number(),
  totalClientesConsiderados: z.number().int(),
});
export type KpiAtivacao = z.infer<typeof kpiAtivacaoSchema>;

export const kpisSchema = z.object({
  computedAt: z.string(),
  liquidez: kpiLiquidezSchema,
  confianca: kpiConfiancaSchema,
  receita: kpiReceitaSchema,
  adocaoIa: kpiAdocaoIaSchema,
  churn: kpiChurnSchema,
  ativacao: kpiAtivacaoSchema,
});
export type Kpis = z.infer<typeof kpisSchema>;
