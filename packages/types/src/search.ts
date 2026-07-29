import { z } from "zod";

/** Busca de marketplace via Meilisearch (E2-01/E2-02) — separado do matching de RFQ (E3-03). */
export const searchPrestadoresQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoria: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type SearchPrestadoresQuery = z.infer<typeof searchPrestadoresQuerySchema>;

export const searchFornecedoresQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoria: z.string().trim().max(100).optional(),
  regiao: z.string().trim().max(160).optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type SearchFornecedoresQuery = z.infer<typeof searchFornecedoresQuerySchema>;

export const searchProdutosQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoria: z.string().trim().max(100).optional(),
  fornecedorId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type SearchProdutosQuery = z.infer<typeof searchProdutosQuerySchema>;

export const prestadorSearchHitSchema = z.object({
  userId: z.string().uuid(),
  nome: z.string(),
  categorias: z.array(z.string()),
  experienciaAnos: z.number().int().nullable(),
  raioAtendimentoKm: z.number().int().nullable(),
  selo: z.string().nullable(),
  notaMedia: z.number().nullable(),
});
export type PrestadorSearchHit = z.infer<typeof prestadorSearchHitSchema>;

export const fornecedorSearchHitSchema = z.object({
  userId: z.string().uuid(),
  razaoSocial: z.string(),
  categorias: z.array(z.string()),
  regioes: z.array(z.string()),
  tempoMercadoAnos: z.number().int().nullable(),
  selo: z.string().nullable(),
  notaMedia: z.number().nullable(),
});
export type FornecedorSearchHit = z.infer<typeof fornecedorSearchHitSchema>;

export const produtoSearchHitSchema = z.object({
  id: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  nome: z.string(),
  categoria: z.string(),
  precoCentavos: z.number().int(),
  unidade: z.string(),
});
export type ProdutoSearchHit = z.infer<typeof produtoSearchHitSchema>;
