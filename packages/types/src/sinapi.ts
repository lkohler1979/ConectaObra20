import { z } from "zod";

/**
 * Busca de SINAPI (insumos/composições, CAIXA) — a pedido do usuário.
 * Sem persistência por enquanto: o backend lê o ZIP mensal publicado pela
 * CAIXA sob demanda e mantém um cache em memória (`SinapiCacheService`),
 * sem model Prisma novo. Fixo em ES; preço sempre do mês de referência
 * mais recente disponível (a CAIXA publica com atraso — ver `referenciaMes`
 * na resposta pra saber qual mês está sendo mostrado).
 */
export const sinapiTipoItemSchema = z.enum(["insumo", "composicao"]);
export type SinapiTipoItem = z.infer<typeof sinapiTipoItemSchema>;

export const sinapiSearchQuerySchema = z.object({
  termo: z.string().trim().min(2, "Informe ao menos 2 caracteres").max(100),
  tipo: z.enum(["insumo", "composicao", "todos"]).default("todos"),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type SinapiSearchQuery = z.infer<typeof sinapiSearchQuerySchema>;

export const sinapiItemSchema = z.object({
  tipo: sinapiTipoItemSchema,
  codigo: z.number().int(),
  descricao: z.string(),
  unidade: z.string(),
  /** Classificação (insumo) ou grupo (composição) — mesma nomenclatura da planilha de origem. */
  categoria: z.string(),
  precoSemDesoneracaoCentavos: z.number().int().nullable(),
  precoComDesoneracaoCentavos: z.number().int().nullable(),
});
export type SinapiItem = z.infer<typeof sinapiItemSchema>;

export const sinapiSearchResponseSchema = z.object({
  regiao: z.literal("ES"),
  referenciaMes: z.string(),
  total: z.number().int(),
  itens: z.array(sinapiItemSchema),
});
export type SinapiSearchResponse = z.infer<typeof sinapiSearchResponseSchema>;
