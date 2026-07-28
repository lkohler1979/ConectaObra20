import { z } from "zod";
import { geoPointSchema } from "./geo";

export const workTypeSchema = z.enum(["REFORMA", "CONSTRUCAO", "AMPLIACAO"]);
export type WorkType = z.infer<typeof workTypeSchema>;

export const workIdSchema = z.string().uuid();

/**
 * `endereco` é texto livre — geocoding automático (endereço → lat/lng) não
 * está implementado, nenhum provedor foi escolhido ainda (ver PENDENCIAS.md).
 * `geo` é opcional: o client manda lat/lng direto (ex: um mapa/autocomplete
 * no frontend que já devolve coordenadas).
 */
export const createWorkInputSchema = z.object({
  titulo: z.string().trim().min(2).max(160),
  tipo: workTypeSchema,
  endereco: z.string().trim().min(5).max(300),
  areaM2: z.number().positive().max(1_000_000).optional(),
  orcamentoPrevistoCentavos: z.number().int().positive().optional(),
  geo: geoPointSchema.optional(),
});
export type CreateWorkInput = z.infer<typeof createWorkInputSchema>;

export const updateWorkInputSchema = createWorkInputSchema.partial();
export type UpdateWorkInput = z.infer<typeof updateWorkInputSchema>;

export const workPublicSchema = z.object({
  id: z.string().uuid(),
  clienteId: z.string().uuid(),
  titulo: z.string(),
  tipo: workTypeSchema,
  endereco: z.string(),
  areaM2: z.number().nullable(),
  orcamentoPrevistoCentavos: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
});
export type WorkPublic = z.infer<typeof workPublicSchema>;
