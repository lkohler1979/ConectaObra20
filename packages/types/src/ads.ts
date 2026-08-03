import { z } from "zod";

/**
 * Anúncios de fornecedores e prestadores exibidos na home (E9-06, escopo
 * reduzido — sem cobrança/billing real ainda, ver PENDENCIAS.md). `Ad`
 * existe desde S0-05; `criativo` era Json livre, aqui ganha uma forma
 * validada.
 */
export const adTipoSchema = z.enum(["CPC", "CPM", "DESTAQUE"]);
export type AdTipo = z.infer<typeof adTipoSchema>;

export const adCriativoSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório").max(160),
  descricao: z.string().trim().max(500).optional(),
  imagemUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
});
export type AdCriativo = z.infer<typeof adCriativoSchema>;

export const createAdInputSchema = z.object({
  tipo: adTipoSchema,
  criativo: adCriativoSchema,
  budgetCentavos: z.number().int().positive(),
  ativo: z.boolean().optional(),
});
export type CreateAdInput = z.infer<typeof createAdInputSchema>;

export const updateAdInputSchema = createAdInputSchema.partial();
export type UpdateAdInput = z.infer<typeof updateAdInputSchema>;

export const adIdSchema = z.string().uuid();

/** Visão do dono (fornecedor/prestador) — inclui budget e status. */
export const adPrivateSchema = z.object({
  id: z.string().uuid(),
  anuncianteId: z.string().uuid(),
  tipo: adTipoSchema,
  criativo: adCriativoSchema,
  budgetCentavos: z.number().int(),
  ativo: z.boolean(),
  createdAt: z.string(),
});
export type AdPrivate = z.infer<typeof adPrivateSchema>;

/** Visão pública (home, sem login) — só anúncios ativos, achatada pro consumo direto na UI. */
export const adPublicSchema = z.object({
  id: z.string().uuid(),
  anuncianteId: z.string().uuid(),
  anuncianteNome: z.string(),
  anuncianteTipo: z.enum(["FORNECEDOR", "PRESTADOR", "TECNICO"]),
  tipo: adTipoSchema,
  titulo: z.string(),
  descricao: z.string().nullable(),
  imagemUrl: z.string().nullable(),
  linkUrl: z.string().nullable(),
});
export type AdPublic = z.infer<typeof adPublicSchema>;

export const listPublicAdsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(6),
});
export type ListPublicAdsQuery = z.infer<typeof listPublicAdsQuerySchema>;
