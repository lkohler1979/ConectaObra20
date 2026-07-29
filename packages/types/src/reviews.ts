import { z } from "zod";

/**
 * Avaliações pós-contrato (E2-04) — notas de 1 a 5 (prazo, qualidade, preço).
 * `avaliadoId` nunca é informado pelo cliente: o backend descobre quem é a
 * outra parte do contrato (ver ReviewsService.create).
 */
export const createReviewInputSchema = z.object({
  notaPrazo: z.number().int().min(1).max(5),
  notaQualidade: z.number().int().min(1).max(5),
  notaPreco: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export const reviewPublicSchema = z.object({
  id: z.string().uuid(),
  contratoId: z.string().uuid(),
  avaliadorId: z.string().uuid(),
  avaliadoId: z.string().uuid(),
  notaPrazo: z.number().int(),
  notaQualidade: z.number().int(),
  notaPreco: z.number().int(),
  comentario: z.string().nullable(),
  createdAt: z.string(),
});
export type ReviewPublic = z.infer<typeof reviewPublicSchema>;
