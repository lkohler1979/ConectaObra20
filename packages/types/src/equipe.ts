import { z } from "zod";

/**
 * Equipe da obra (E6-04) — visualização compartilhada, só leitura. Membro
 * não ganha nenhum poder de escrita (criar RFQ, aprovar etapa, aceitar
 * proposta continuam exclusivos do cliente dono).
 */
export const addTeamMemberInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
});
export type AddTeamMemberInput = z.infer<typeof addTeamMemberInputSchema>;

export const teamMemberUserIdSchema = z.string().uuid();

export const teamMemberPublicSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  userId: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  tipo: z.string(),
  createdAt: z.string(),
});
export type TeamMemberPublic = z.infer<typeof teamMemberPublicSchema>;
