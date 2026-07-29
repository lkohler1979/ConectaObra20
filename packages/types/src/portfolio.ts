import { z } from "zod";

/** Obras anteriores do prestador (E1-05) — cada item é um projeto do portfólio. */
export const createPortfolioItemInputSchema = z.object({
  titulo: z.string().trim().min(2).max(160),
  descricao: z.string().trim().max(2000).optional(),
  fotos: z.array(z.string().url()).max(20).default([]),
});
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemInputSchema>;

export const updatePortfolioItemInputSchema = createPortfolioItemInputSchema.partial();
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemInputSchema>;

export const portfolioItemIdSchema = z.string().uuid();

export const portfolioItemPublicSchema = z.object({
  id: z.string().uuid(),
  prestadorId: z.string().uuid(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  fotos: z.array(z.string()),
  createdAt: z.string(),
});
export type PortfolioItemPublic = z.infer<typeof portfolioItemPublicSchema>;
