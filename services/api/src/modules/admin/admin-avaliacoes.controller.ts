import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import {
  avaliacaoAdminIdSchema,
  listAdminAvaliacoesQuerySchema,
  ocultarAvaliacaoInputSchema,
  type ListAdminAvaliacoesQuery,
  type OcultarAvaliacaoInput,
} from "@conectaobra/types/avaliacoes";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { AdminAvaliacoesService } from "./admin-avaliacoes.service";

/** Moderação de conteúdo (P-091) — exclusiva do ADMIN. */
@Controller("admin/avaliacoes")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("ADMIN")
export class AdminAvaliacoesController {
  constructor(private readonly adminAvaliacoes: AdminAvaliacoesService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listAdminAvaliacoesQuerySchema)) query: ListAdminAvaliacoesQuery,
  ) {
    return this.adminAvaliacoes.list(query);
  }

  @Patch(":id/ocultar")
  ocultar(
    @Param("id", new ZodValidationPipe(avaliacaoAdminIdSchema)) id: string,
    @Body(new ZodValidationPipe(ocultarAvaliacaoInputSchema)) body: OcultarAvaliacaoInput,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminAvaliacoes.ocultar(admin.sub, id, body.motivo);
  }

  @Patch(":id/reativar")
  reativar(
    @Param("id", new ZodValidationPipe(avaliacaoAdminIdSchema)) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminAvaliacoes.reativar(admin.sub, id);
  }
}
