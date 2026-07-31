import { z } from "zod";

/**
 * Base de conhecimento do "Engenheiro Virtual" (E5-01) — pipeline RAG:
 * ingestão → chunking → embeddings (pgvector) → retrieval. Embeddings são
 * SIMULADOS (feature hashing determinístico) até um provedor real
 * (OpenAI/Voyage/Cohere) ser escolhido — decisão confirmada com o usuário
 * nesta sessão, ver PENDENCIAS.md. `conteudo` deve ser sempre resumo
 * autoral, nunca texto integral de NBR (CLAUDE.md §5 regra 3).
 */
export const ingestKnowledgeInputSchema = z.object({
  fonte: z.string().trim().min(1).max(100),
  titulo: z.string().trim().min(1).max(300),
  conteudo: z.string().trim().min(1).max(50_000),
  categoria: z.string().trim().min(1).max(100).optional(),
  url: z.string().url().optional(),
});
export type IngestKnowledgeInput = z.infer<typeof ingestKnowledgeInputSchema>;

export const knowledgeChunkPublicSchema = z.object({
  id: z.string().uuid(),
  fonte: z.string(),
  titulo: z.string(),
  conteudo: z.string(),
  categoria: z.string().nullable(),
  url: z.string().nullable(),
  createdAt: z.string(),
});
export type KnowledgeChunkPublic = z.infer<typeof knowledgeChunkPublicSchema>;

export const searchKnowledgeQuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
  limit: z.coerce.number().int().positive().max(20).default(5),
});
export type SearchKnowledgeQuery = z.infer<typeof searchKnowledgeQuerySchema>;

export const knowledgeSearchResultSchema = knowledgeChunkPublicSchema.extend({
  distancia: z.number(),
});
export type KnowledgeSearchResult = z.infer<typeof knowledgeSearchResultSchema>;
