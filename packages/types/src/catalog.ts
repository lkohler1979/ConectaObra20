import { z } from "zod";

/** Vitrine de produtos do fornecedor (E1-06/E2-06) — model Product já existe desde S0-05. */
export const createProductInputSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  categoria: z.string().trim().min(2).max(100),
  precoCentavos: z.number().int().positive(),
  unidade: z.string().trim().min(1).max(20),
  estoque: z.number().int().min(0).optional(),
  fotos: z.array(z.string().url()).max(20).default([]),
  /** Código do fornecedor pro produto (SKU) — único por fornecedor, usado em cotações (E7). */
  codigo: z.string().trim().min(1).max(60).optional(),
  descricao: z.string().trim().max(2000).optional(),
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
  codigo: z.string().nullable(),
  descricao: z.string().nullable(),
  createdAt: z.string(),
});
export type ProductPublic = z.infer<typeof productPublicSchema>;

/**
 * Import de produtos via planilha Excel (E1-06, extensão) — colunas
 * esperadas: código, descrição, unidade, valor. Usado pra alimentar a
 * lista de produtos usada em cotações futuras (E7).
 */
export const importProductRowErrorSchema = z.object({
  linha: z.number().int().positive(),
  motivo: z.string(),
});
export type ImportProductRowError = z.infer<typeof importProductRowErrorSchema>;

export const importProductsResultSchema = z.object({
  totalLinhas: z.number().int().min(0),
  criados: z.number().int().min(0),
  atualizados: z.number().int().min(0),
  erros: z.array(importProductRowErrorSchema),
});
export type ImportProductsResult = z.infer<typeof importProductsResultSchema>;
