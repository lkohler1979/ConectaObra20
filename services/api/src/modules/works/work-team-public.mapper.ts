import type { WorkTeamMember } from "@prisma/client";
import type { TeamMemberPublic } from "@conectaobra/types/equipe";

type WorkTeamMemberWithUser = WorkTeamMember & {
  user: { nome: string; email: string; tipo: string };
};

export function toPublicTeamMember(member: WorkTeamMemberWithUser): TeamMemberPublic {
  return {
    id: member.id,
    obraId: member.obraId,
    userId: member.userId,
    nome: member.user.nome,
    email: member.user.email,
    tipo: member.user.tipo,
    createdAt: member.createdAt.toISOString(),
  };
}
