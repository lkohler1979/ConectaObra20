import { z } from "zod";

/**
 * Catálogo de plantas (E9-05) — arquitetos/técnicos publicam e vendem
 * projetos arquitetônicos. `ProjectCatalog` existe desde S0-05 (sem
 * endpoints); ganhou `descricao`/`imagemCapaUrl` pra ter conteúdo de
 * vitrine pública (arquivos reais só liberam após a compra, ver E9-05
 * parte 2 — entrega com marca d'água).
 */
export const projectCategorySchema = z.enum([
  "CASA",
  "SOBRADO",
  "GALPAO",
  "CHACARA",
  "CONDOMINIO",
]);
export type ProjectCategory = z.infer<typeof projectCategorySchema>;

export const createProjectInputSchema = z.object({
  titulo: z.string().trim().min(2, "Título obrigatório").max(200),
  categoria: projectCategorySchema,
  precoCentavos: z.number().int().positive(),
  descricao: z.string().trim().max(4000).optional(),
  imagemCapaUrl: z.string().url().optional(),
  licenca: z.string().trim().min(1).max(200).optional(),
  /** URLs dos arquivos reais (S3) — sem pelo menos 1, não há o que vender. */
  arquivos: z.array(z.string().url()).min(1, "Envie ao menos um arquivo"),
});
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = createProjectInputSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const projectIdSchema = z.string().uuid();

/** Visão do dono (arquiteto/técnico) — inclui os arquivos reais. */
export const projectPrivateSchema = z.object({
  id: z.string().uuid(),
  arquitetoId: z.string().uuid(),
  titulo: z.string(),
  categoria: projectCategorySchema,
  precoCentavos: z.number().int(),
  descricao: z.string().nullable(),
  imagemCapaUrl: z.string().nullable(),
  licenca: z.string().nullable(),
  arquivos: z.array(z.string()),
  vendasCount: z.number().int(),
  createdAt: z.string(),
});
export type ProjectPrivate = z.infer<typeof projectPrivateSchema>;

/** Visão pública (vitrine, sem login) — nunca inclui `arquivos` (conteúdo pago). */
export const projectPublicSchema = z.object({
  id: z.string().uuid(),
  arquitetoId: z.string().uuid(),
  arquitetoNome: z.string(),
  titulo: z.string(),
  categoria: projectCategorySchema,
  precoCentavos: z.number().int(),
  descricao: z.string().nullable(),
  imagemCapaUrl: z.string().nullable(),
  licenca: z.string().nullable(),
  vendasCount: z.number().int(),
  createdAt: z.string(),
});
export type ProjectPublic = z.infer<typeof projectPublicSchema>;

export const listPublicProjectsQuerySchema = z.object({
  categoria: projectCategorySchema.optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type ListPublicProjectsQuery = z.infer<typeof listPublicProjectsQuerySchema>;

/**
 * Compra de uma planta (E9-05 parte 2) — PSP SIMULADO, mesmo padrão de
 * PurchaseOrder (E7-04). `arquivosEntregues` tem marca d'água quando o S3
 * está configurado; sem S3, cai pros arquivos originais sem marca d'água
 * (`marcaDaguaAplicada: false`) — não bloqueia a compra.
 */
export const projectPurchasePublicSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  compradorId: z.string().uuid(),
  precoCentavos: z.number().int(),
  comissaoCentavos: z.number().int(),
  pspRef: z.string(),
  status: z.string(),
  arquivosEntregues: z.array(z.string()),
  marcaDaguaAplicada: z.boolean(),
  createdAt: z.string(),
});
export type ProjectPurchasePublic = z.infer<typeof projectPurchasePublicSchema>;
