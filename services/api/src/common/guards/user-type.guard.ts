import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ALLOWED_USER_TYPES_KEY } from "../decorators/allowed-user-types.decorator";
import type { JwtPayload } from "../../modules/identity/auth/strategies/jwt.strategy";

/** Roda depois de JwtAuthGuard — depende de req.user já populado. */
@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // `getAllAndOverride` — sem isso, `@AllowedUserTypes` aplicado na CLASSE
    // (padrão usado por AdminUsersController/ArticlesController/etc.) nunca
    // era lido (bug encontrado nesta sessão): `ctx.getHandler()` só devolve
    // metadata setada diretamente no método, então todo controller com o
    // decorator só na classe deixava passar qualquer usuário autenticado,
    // de qualquer tipo, sem nenhuma restrição real.
    const allowed = this.reflector.getAllAndOverride<string[]>(ALLOWED_USER_TYPES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!allowed || allowed.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    if (!allowed.includes(user.tipo)) {
      throw new ForbiddenException(
        `Ação não permitida para o tipo de usuário ${user.tipo}`,
      );
    }
    return true;
  }
}
