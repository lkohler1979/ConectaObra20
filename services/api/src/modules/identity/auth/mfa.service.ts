import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { authenticator } from "otplib";
import type { MfaSetupOutput } from "@conectaobra/types/auth";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";

const ISSUER = "ConectaObra";

/**
 * TOTP (RFC 6238) via otplib — alicerce de "MFA obrigatório para operações
 * financeiras" (CLAUDE.md §5, E1-04). A exigência por operação (bloquear
 * ações do escrow sem MFA) é aplicada quando os endpoints financeiros
 * existirem (épico E4); aqui entra o setup/enable/disable e o desafio no
 * login.
 */
@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async setup(userId: string, email: string): Promise<MfaSetupOutput> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.mfaEnabled) {
      throw new ConflictException("MFA já está habilitado");
    }

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });

    return { secret, otpauthUrl: authenticator.keyuri(email, ISSUER, secret) };
  }

  async enable(userId: string, codigo: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.mfaEnabled) {
      throw new ConflictException("MFA já está habilitado");
    }
    if (!user.mfaSecret) {
      throw new BadRequestException("Chame /auth/mfa/setup antes de habilitar");
    }
    if (!authenticator.check(codigo, user.mfaSecret)) {
      throw new BadRequestException("Código inválido");
    }

    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    await this.auditLog.record({ userId, acao: "mfa.enabled", entidade: "user", payload: {} });
  }

  async disable(userId: string, codigo: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException("MFA não está habilitado");
    }
    if (!authenticator.check(codigo, user.mfaSecret)) {
      throw new BadRequestException("Código inválido");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
    await this.auditLog.record({ userId, acao: "mfa.disabled", entidade: "user", payload: {} });
  }

  async verifyCode(userId: string, codigo: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException("MFA não está habilitado para este usuário");
    }
    if (!authenticator.check(codigo, user.mfaSecret)) {
      await this.auditLog.record({
        userId,
        acao: "mfa.verify_login_failed",
        entidade: "user",
        payload: {},
      });
      throw new BadRequestException("Código inválido");
    }
  }
}
