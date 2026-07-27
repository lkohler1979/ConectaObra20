import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "./strategies/jwt.strategy";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
