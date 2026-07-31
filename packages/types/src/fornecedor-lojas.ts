import { z } from "zod";
import { geoPointSchema } from "./geo";

/** Lojas/filiais físicas do fornecedor — um fornecedor pode ter várias unidades. */
export const createFornecedorLojaInputSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(150),
  endereco: z.string().trim().min(1, "Endereço obrigatório").max(300),
  regiao: z.string().trim().min(1).max(150).optional(),
  telefone: z.string().trim().min(1).max(30).optional(),
  geo: geoPointSchema.optional(),
});
export type CreateFornecedorLojaInput = z.infer<typeof createFornecedorLojaInputSchema>;

export const updateFornecedorLojaInputSchema = createFornecedorLojaInputSchema.partial();
export type UpdateFornecedorLojaInput = z.infer<typeof updateFornecedorLojaInputSchema>;

export const fornecedorLojaIdSchema = z.string().uuid();

export const fornecedorLojaPublicSchema = z.object({
  id: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  nome: z.string(),
  endereco: z.string(),
  regiao: z.string().nullable(),
  telefone: z.string().nullable(),
  createdAt: z.string(),
});
export type FornecedorLojaPublic = z.infer<typeof fornecedorLojaPublicSchema>;
