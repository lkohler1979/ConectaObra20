import { createHash, randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { env } from "../../../config/env";

export interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Refresh token opaco (não-JWT) com rotação: cada uso invalida o token
 * anterior e emite um novo. Reuso de um token já revogado indica possível
 * roubo — revoga toda a cadeia daquele usuário (CLAUDE.md: financeiro exige
 * rastreabilidade; aqui aplicamos o mesmo rigor à sessão).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  issueAccessToken(user: { id: string; tipo: string }): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, tipo: user.tipo, scope: "access" },
      { secret: env.JWT_SECRET, expiresIn: env.JWT_ACCESS_TTL_SECONDS },
    );
  }

  /** Curto e de escopo restrito — só serve pra /auth/mfa/verify-login (E1-04). */
  issueMfaChallengeToken(user: { id: string; tipo: string }): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, tipo: user.tipo, scope: "mfa_challenge" },
      { secret: env.JWT_SECRET, expiresIn: env.MFA_CHALLENGE_TTL_SECONDS },
    );
  }

  async verifyMfaChallengeToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        scope: string;
      }>(token, { secret: env.JWT_SECRET });
      if (payload.scope !== "mfa_challenge") {
        throw new UnauthorizedException("Token de desafio MFA inválido");
      }
      return { userId: payload.sub };
    } catch {
      throw new UnauthorizedException("Token de desafio MFA inválido ou expirado");
    }
  }

  async issueRefreshToken(userId: string, meta: RequestMeta): Promise<string> {
    const raw = randomBytes(48).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(raw),
        expiresAt: this.refreshExpiry(),
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });
    return raw;
  }

  async rotateRefreshToken(
    rawToken: string,
    meta: RequestMeta,
  ): Promise<{ userId: string; refreshToken: string }> {
    const tokenHash = sha256(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    if (existing.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        "Refresh token já utilizado — sessão revogada por segurança",
      );
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expirado");
    }

    const newRaw = randomBytes(48).toString("hex");
    const newHash = sha256(newRaw);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), replacedByTokenHash: newHash },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: existing.userId,
          tokenHash: newHash,
          expiresAt: this.refreshExpiry(),
          userAgent: meta.userAgent,
          ip: meta.ip,
        },
      }),
    ]);

    return { userId: existing.userId, refreshToken: newRaw };
  }

  async revoke(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Usado pela exclusão de conta (E1-08) — encerra todas as sessões do
   * usuário. `client` opcional permite chamar dentro do mesmo `$transaction`
   * que anonimiza a conta, pra não deixar refresh tokens válidos "escapando"
   * caso a revogação falhe depois da anonimização já ter sido commitada.
   */
  async revokeAllForUser(
    userId: string,
    client: PrismaClientOrTx = this.prisma,
  ): Promise<void> {
    await client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  }
}
