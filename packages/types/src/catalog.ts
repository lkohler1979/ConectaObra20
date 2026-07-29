import { z } from "zod";

/** Vitrine de produtos do fornecedor (E1-06/E2-06) — model Product já existe desde S0-05. */
export const createProductInputSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  categoria: z.string().trim().min(2).max(100),
  precoCentavos: z.number().int().positive(),
  unidade: z.string().trim().min(1).max(20),
  estoque: z.number().int().min(0).optional(),
  fotos: z.array(z.string().url()).max(20).default([]),
});
export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = createProductInputSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const productIdSchema = z.string().uuid();

export const productPublicSchema = z.object({
  id: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  nome: z.string(),
  categoria: z.string(),
  precoCentavos: z.number().int(),
  unidade: z.string(),
  estoque: z.number().int().nullable(),
  fotos: z.array(z.string()),
  createdAt: z.string(),
});
export type ProductPublic = z.infer<typeof productPublicSchema>;
