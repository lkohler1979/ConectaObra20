import { z } from "zod";

/**
 * Lista de materiais (E7-01). `origem: IA` existe no schema (S0-05) pra
 * quando o "Engenheiro Virtual" (RAG, E5) existir de verdade — hoje só
 * criação manual está implementada, ver PENDENCIAS.md.
 */
export const materialListItemSchema = z.object({
  descricao: z.string().trim().min(1, "Descrição obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  unidade: z.string().trim().min(1, "Unidade obrigatória"),
  produtoId: z.string().uuid().optional(),
  /** Usada pela cotação automática (E7-02) pra casar com `ProfileFornecedor.categorias`. */
  categoria: z.string().trim().min(1).optional(),
  observacao: z.string().trim().optional(),
});
export type MaterialListItem = z.infer<typeof materialListItemSchema>;

export const materialListIdSchema = z.string().uuid();

export const createMaterialListInputSchema = z.object({
  obraId: z.string().uuid(),
  itens: z.array(materialListItemSchema).min(1, "Informe pelo menos um item"),
});
export type CreateMaterialListInput = z.infer<typeof createMaterialListInputSchema>;

export const updateMaterialListInputSchema = z.object({
  itens: z.array(materialListItemSchema).min(1, "Informe pelo menos um item"),
});
export type UpdateMaterialListInput = z.infer<typeof updateMaterialListInputSchema>;

export const listMaterialListsQuerySchema = z.object({
  obraId: z.string().uuid(),
});
export type ListMaterialListsQuery = z.infer<typeof listMaterialListsQuerySchema>;

export const materialListPublicSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  itens: z.array(materialListItemSchema),
  origem: z.enum(["MANUAL", "IA"]),
  createdAt: z.string(),
});
export type MaterialListPublic = z.infer<typeof materialListPublicSchema>;
