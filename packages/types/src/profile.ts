import { z } from "zod";
import { geoPointSchema } from "./geo";

/**
 * Perfil de PRESTADOR — reaproveitado por TECNICO (arquitetos, engenheiros,
 * designers, topógrafos, calculistas): o doc 02 §3 não define um profile
 * dedicado para técnico, e o formato de profiles_prestador já cobre o caso
 * (categorias/certificados livres). Ver ProfilePrestador em schema.prisma.
 */
export const prestadorProfileInputSchema = z.object({
  categorias: z.array(z.string().min(1)).min(1),
  experienciaAnos: z.number().int().min(0).max(80).optional(),
  certificados: z.array(z.string().min(1)).default([]),
  raioAtendimentoKm: z.number().int().positive().max(500).optional(),
  geo: geoPointSchema.optional(),
});
export type PrestadorProfileInput = z.infer<typeof prestadorProfileInputSchema>;

export const fornecedorProfileInputSchema = z.object({
  razaoSocial: z.string().trim().min(2).max(200),
  categorias: z.array(z.string().min(1)).min(1),
  regioes: z.array(z.string().min(1)).min(1),
  tempoMercadoAnos: z.number().int().min(0).max(150).optional(),
  certificacoes: z.array(z.string().min(1)).default([]),
});
export type FornecedorProfileInput = z.infer<typeof fornecedorProfileInputSchema>;
