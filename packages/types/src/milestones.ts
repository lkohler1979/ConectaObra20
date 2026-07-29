import { z } from "zod";

/**
 * Cronograma de etapas do contrato (E6-01) — segue o loop central do
 * CLAUDE.md: prestador executa a etapa e entrega evidências (fotos +
 * checklist) → cliente aprova. Sem Gantt/dependências entre etapas (não
 * modelado no schema) — só a ordem sequencial (`ordem`, inteiro).
 */
export const milestoneStatusSchema = z.enum([
  "PENDENTE",
  "EM_EXECUCAO",
  "ENTREGUE",
  "APROVADO",
  "EM_DISPUTA",
  "PAGO",
]);
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

export const createMilestoneInputSchema = z.object({
  ordem: z.number().int().positive(),
  descricao: z.string().trim().min(2).max(500),
  valorCentavos: z.number().int().positive(),
  checklist: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneInputSchema>;

export const entregarMilestoneInputSchema = z.object({
  fotos: z.array(z.string().url()).min(1).max(20),
});
export type EntregarMilestoneInput = z.infer<typeof entregarMilestoneInputSchema>;

export const milestoneIdSchema = z.string().uuid();

export const milestonePublicSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  ordem: z.number().int(),
  descricao: z.string(),
  valorCentavos: z.number().int(),
  checklist: z.array(z.string()),
  fotos: z.array(z.string()),
  status: milestoneStatusSchema,
  aprovadoEm: z.string().nullable(),
  aprovadoPorId: z.string().uuid().nullable(),
  createdAt: z.string(),
});
export type MilestonePublic = z.infer<typeof milestonePublicSchema>;
