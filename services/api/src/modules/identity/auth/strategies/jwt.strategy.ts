import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "../../../../config/env";

export interface JwtPayload {
  sub: string;
  tipo: string;
  scope: "access" | "mfa_challenge";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // mfa_challenge é só pra /auth/mfa/verify-login — nunca autentica uma rota comum.
    if (payload.scope !== "access") {
      throw new UnauthorizedException("Token inválido para esta operação");
    }
    return payload;
  }
}
