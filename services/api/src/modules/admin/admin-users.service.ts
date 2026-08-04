import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AdminUser, ListAdminUsersQuery } from "@conectaobra/types/admin";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { TokenService } from "../identity/auth/token.service";
import { toAdminUser } from "./admin-user.mapper";

/** Moderação de perfis (E10-01) — suspender/reativar conta, exclusivo do ADMIN. */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(query: ListAdminUsersQuery): Promise<AdminUser[]> {
    const where: Prisma.UserWhereInput = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.suspenso !== undefined) where.suspenso = query.suspenso;
    if (query.q) {
      where.OR = [
        { nome: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });
    return users.map(toAdminUser);
  }

  async getById(id: string): Promise<AdminUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    return toAdminUser(user);
  }

  async suspend(adminId: string, userId: string, motivo: string): Promise<AdminUser> {
    if (adminId === userId) {
      throw new ForbiddenException("Você não pode suspender a própria conta");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (user.deletedAt) {
      throw new ConflictException("Conta já foi excluída");
    }
    if (user.suspenso) {
      throw new ConflictException("Conta já está suspensa");
    }

    // Atômico: sem isso, uma falha entre marcar suspenso e revogar as sessões
    // deixaria refresh tokens válidos pra uma conta que já deveria estar
    // bloqueada (mesmo cuidado de AccountService.deleteAccount, E1-08).
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: userId },
        data: { suspenso: true, suspensoMotivo: motivo, suspensoEm: new Date() },
      });
      await this.tokens.revokeAllForUser(userId, tx);
      return result;
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "admin.user_suspended",
      entidade: "user",
      payload: { alvoId: userId, motivo },
    });

    return toAdminUser(updated);
  }

  async reactivate(adminId: string, userId: string): Promise<AdminUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (!user.suspenso) {
      throw new ConflictException("Conta não está suspensa");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { suspenso: false, suspensoMotivo: null, suspensoEm: null },
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "admin.user_reactivated",
      entidade: "user",
      payload: { alvoId: userId },
    });

    return toAdminUser(updated);
  }
}
