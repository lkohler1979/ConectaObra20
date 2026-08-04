import { z } from "zod";

/**
 * Moderação de perfis (E10-01) — painel ADMIN. Escopo confirmado com o
 * usuário via `AskUserQuestion`: suspender/reativar conta, sem histórico de
 * moderação dedicado (reaproveita `audit_log`, já append-only).
 */
export const adminUserTypeSchema = z.enum([
  "CLIENTE_PF",
  "CLIENTE_PJ",
  "PRESTADOR",
  "FORNECEDOR",
  "TECNICO",
  "ADMIN",
]);
export type AdminUserType = z.infer<typeof adminUserTypeSchema>;

export const adminUserIdSchema = z.string().uuid();

/** Visão do ADMIN — inclui cpfCnpj/telefone (necessário pra moderação/identificação), nunca senhaHash/mfaSecret. */
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  tipo: adminUserTypeSchema,
  nome: z.string(),
  email: z.string(),
  telefone: z.string().nullable(),
  cpfCnpj: z.string(),
  kycStatus: z.enum(["PENDENTE", "APROVADO", "REPROVADO"]),
  suspenso: z.boolean(),
  suspensoMotivo: z.string().nullable(),
  suspensoEm: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const listAdminUsersQuerySchema = z.object({
  tipo: adminUserTypeSchema.optional(),
  q: z.string().trim().min(1).max(160).optional(),
  suspenso: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

export const suspendUserInputSchema = z.object({
  motivo: z.string().trim().min(3, "Motivo obrigatório").max(500),
});
export type SuspendUserInput = z.infer<typeof suspendUserInputSchema>;
