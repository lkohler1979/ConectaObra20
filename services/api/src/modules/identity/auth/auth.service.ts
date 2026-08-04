import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  AuthTokens,
  LoginInput,
  LoginResult,
  MfaVerifyLoginInput,
  RefreshInput,
  RegisterInput,
  UserPublic,
} from "@conectaobra/types/auth";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { env } from "../../../config/env";
import { ConsentService } from "../legal/consent.service";
import { MfaService } from "./mfa.service";
import { PasswordService } from "./password.service";
import { TokenService, type RequestMeta } from "./token.service";
import { toPublicUser } from "./user-public.mapper";

export interface AuthResult {
  user: UserPublic;
  tokens: LoginResult;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly mfa: MfaService,
    private readonly consent: ConsentService,
    private readonly auditLog: AuditLogService,
  ) {}

  async register(input: RegisterInput, meta: RequestMeta): Promise<AuthResult> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          { telefone: input.telefone },
          { cpfCnpj: input.cpfCnpj },
        ],
      },
    });
    if (existing) {
      throw new ConflictException("E-mail, telefone ou CPF/CNPJ já cadastrado");
    }

    const senhaHash = await this.password.hash(input.senha);

    // Atômico: sem isso, uma falha entre criar o usuário e gravar o
    // consentimento deixaria uma conta cadastrada sem o registro de
    // aceite dos Termos/Política que a E1-08 existe pra garantir.
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tipo: input.tipo,
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          cpfCnpj: input.cpfCnpj,
          senhaHash,
        },
      });

      await this.consent.recordMandatoryOnRegister(created.id, tx);

      return created;
    });

    await this.auditLog.record({
      userId: user.id,
      acao: "auth.register",
      entidade: "user",
      payload: { tipo: user.tipo, email: user.email },
      ip: meta.ip,
    });

    const tokens = await this.issueTokens(user, meta);
    return { user: toPublicUser(user), tokens: { mfaRequired: false, ...tokens } };
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const senhaValida = user
      ? await this.password.compare(input.senha, user.senhaHash)
      : false;

    if (!user || !senhaValida) {
      await this.auditLog.record({
        acao: "auth.login_failed",
        entidade: "user",
        payload: { email: input.email },
        ip: meta.ip,
      });
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    if (user.suspenso) {
      await this.auditLog.record({
        userId: user.id,
        acao: "auth.login_suspended",
        entidade: "user",
        payload: {},
        ip: meta.ip,
      });
      throw new ForbiddenException("Conta suspensa — entre em contato com o suporte");
    }

    if (user.mfaEnabled) {
      const mfaToken = await this.tokens.issueMfaChallengeToken(user);
      await this.auditLog.record({
        userId: user.id,
        acao: "auth.login_mfa_challenge",
        entidade: "user",
        payload: {},
        ip: meta.ip,
      });
      return { user: toPublicUser(user), tokens: { mfaRequired: true, mfaToken } };
    }

    await this.auditLog.record({
      userId: user.id,
      acao: "auth.login",
      entidade: "user",
      payload: {},
      ip: meta.ip,
    });

    const tokens = await this.issueTokens(user, meta);
    return { user: toPublicUser(user), tokens: { mfaRequired: false, ...tokens } };
  }

  /** Segunda etapa do login quando mfaEnabled — troca mfaToken + código TOTP pelos tokens finais. */
  async completeMfaLogin(input: MfaVerifyLoginInput, meta: RequestMeta): Promise<AuthTokens> {
    const { userId } = await this.tokens.verifyMfaChallengeToken(input.mfaToken);
    await this.mfa.verifyCode(userId, input.codigo);

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    await this.auditLog.record({
      userId,
      acao: "auth.login_mfa_completed",
      entidade: "user",
      payload: {},
      ip: meta.ip,
    });

    return this.issueTokens(user, meta);
  }

  async refresh(input: RefreshInput, meta: RequestMeta): Promise<AuthTokens> {
    const { userId, refreshToken } = await this.tokens.rotateRefreshToken(
      input.refreshToken,
      meta,
    );
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.suspenso) {
      await this.tokens.revoke(refreshToken);
      throw new ForbiddenException("Conta suspensa — entre em contato com o suporte");
    }

    const accessToken = await this.tokens.issueAccessToken(user);

    return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL_SECONDS };
  }

  async logout(refreshToken: string, userId?: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
    if (userId) {
      await this.auditLog.record({
        userId,
        acao: "auth.logout",
        entidade: "user",
        payload: {},
      });
    }
  }

  private async issueTokens(
    user: { id: string; tipo: string },
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.issueAccessToken(user),
      this.tokens.issueRefreshToken(user.id, meta),
    ]);
    return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL_SECONDS };
  }
}
