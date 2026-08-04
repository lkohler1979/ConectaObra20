import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import {
  adminUserIdSchema,
  listAdminUsersQuerySchema,
  suspendUserInputSchema,
  type ListAdminUsersQuery,
  type SuspendUserInput,
} from "@conectaobra/types/admin";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { AdminUsersService } from "./admin-users.service";

/** Moderação de perfis (E10-01) — exclusiva do ADMIN. */
@Controller("admin/users")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("ADMIN")
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listAdminUsersQuerySchema)) query: ListAdminUsersQuery) {
    return this.adminUsers.list(query);
  }

  @Get(":id")
  getById(@Param("id", new ZodValidationPipe(adminUserIdSchema)) id: string) {
    return this.adminUsers.getById(id);
  }

  @Patch(":id/suspender")
  suspend(
    @Param("id", new ZodValidationPipe(adminUserIdSchema)) id: string,
    @Body(new ZodValidationPipe(suspendUserInputSchema)) body: SuspendUserInput,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminUsers.suspend(admin.sub, id, body.motivo);
  }

  @Patch(":id/reativar")
  reactivate(
    @Param("id", new ZodValidationPipe(adminUserIdSchema)) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminUsers.reactivate(admin.sub, id);
  }
}
