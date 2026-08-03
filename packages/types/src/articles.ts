import { z } from "zod";

/**
 * Portal de notícias (E9-01) e biblioteca (E9-04, guias/checklists/modelos
 * de contrato) — mesmo model `Article` (schema desde S0-05), diferenciados
 * só por `categoria`. Ingestão exclusiva do ADMIN (mesmo padrão de
 * KnowledgeChunk/AvgCost — evita conteúdo arbitrário publicado sem revisão).
 */
export const articleSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter só letras minúsculas, números e hífens");

export const createArticleInputSchema = z.object({
  titulo: z.string().trim().min(2, "Título obrigatório").max(200),
  /** Opcional — se omitido, é gerado a partir do título (com sufixo -2/-3 em caso de colisão). */
  slug: articleSlugSchema.optional(),
  categoria: z.string().trim().min(1, "Categoria obrigatória").max(100),
  corpo: z.string().trim().min(1, "Corpo obrigatório"),
  autor: z.string().trim().min(1, "Autor obrigatório").max(150),
  arquivoUrl: z.string().url().optional(),
  /** Omitido = rascunho (não aparece no portal público). */
  publicadoEm: z.coerce.date().optional(),
});
export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

export const updateArticleInputSchema = createArticleInputSchema.partial();
export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;

export const articleIdSchema = z.string().uuid();

/** Visão do ADMIN — inclui rascunhos (publicadoEm null). */
export const articlePrivateSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  slug: z.string(),
  categoria: z.string(),
  corpo: z.string(),
  autor: z.string(),
  arquivoUrl: z.string().nullable(),
  publicadoEm: z.string().nullable(),
});
export type ArticlePrivate = z.infer<typeof articlePrivateSchema>;

/** Visão pública (sem login) — só artigos já publicados chegam aqui. */
export const articlePublicSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  slug: z.string(),
  categoria: z.string(),
  corpo: z.string(),
  autor: z.string(),
  arquivoUrl: z.string().nullable(),
  publicadoEm: z.string(),
});
export type ArticlePublic = z.infer<typeof articlePublicSchema>;

export const listPublicArticlesQuerySchema = z.object({
  categoria: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type ListPublicArticlesQuery = z.infer<typeof listPublicArticlesQuerySchema>;
