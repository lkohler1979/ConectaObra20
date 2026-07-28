import { randomBytes } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { PasswordService } from "../auth/password.service";
import { TokenService } from "../auth/token.service";

/**
 * Exclusão de conta (E1-08) é anonimização, não hard-delete: o histórico
 * financeiro/contratual (contracts, milestones, escrow_transactions, audit_log
 * etc.) referencia users.id e precisa ser preservado — inclusive porque
 * escrow_transactions e audit_log são append-only por design (CLAUDE.md §5
 * regras 1 e 4). Um DELETE literal também falharia por FK assim que o
 * usuário tivesse qualquer histórico (as relações usam onDelete: Restrict
 * por padrão). Em vez disso: PII sobrescrita com valores anônimos, senha
 * invalidada, MFA desligado, todas as sessões revogadas, `deletedAt` marcado.
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly auditLog: AuditLogService,
  ) {}

  async deleteAccount(userId: string, senha: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.deletedAt) {
      throw new ConflictException("Conta já foi excluída");
    }

    const senhaValida = await this.password.compare(senha, user.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException("Senha incorreta");
    }

    const senhaInutilizada = await this.password.hash(randomBytes(32).toString("hex"));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        nome: "Usuário removido",
        email: `deleted-${userId}@removed.conectaobra.local`,
        telefone: null,
        cpfCnpj: `ANON-${userId}`,
        senhaHash: senhaInutilizada,
        mfaEnabled: false,
        mfaSecret: null,
        deletedAt: new Date(),
      },
    });

    await this.tokens.revokeAllForUser(userId);

    await this.auditLog.record({
      userId,
      acao: "account.deleted",
      entidade: "user",
      payload: {},
    });
  }
}
