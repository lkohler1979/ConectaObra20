import type { User } from "@prisma/client";
import type { AdminUser } from "@conectaobra/types/admin";

/** Nunca inclui senhaHash/mfaSecret — só o necessário pra moderação (E10-01). */
export function toAdminUser(user: User): AdminUser {
  return {
    id: user.id,
    tipo: user.tipo,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    cpfCnpj: user.cpfCnpj,
    kycStatus: user.kycStatus,
    suspenso: user.suspenso,
    suspensoMotivo: user.suspensoMotivo,
    suspensoEm: user.suspensoEm?.toISOString() ?? null,
    deletedAt: user.deletedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
