import type { User } from "@prisma/client";
import type { UserPublic } from "@conectaobra/types/auth";

/** Nunca inclui senhaHash — é assim que garantimos que ele não vaza pra fora do módulo. */
export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    tipo: user.tipo,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    telefoneVerificado: user.telefoneVerificado,
    kycStatus: user.kycStatus,
  };
}
