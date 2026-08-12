import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createWorkInputSchema,
  updateWorkInputSchema,
  workIdSchema,
  type CreateWorkInput,
  type UpdateWorkInput,
} from "@conectaobra/types/works";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { AvaliacoesService } from "../avaliacoes/avaliacoes.service";
import { WorksService } from "./works.service";

@Controller("works")
@UseGuards(JwtAuthGuard)
export class WorksController {
  constructor(
    private readonly worksService: WorksService,
    private readonly avaliacoesService: AvaliacoesService,
  ) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  create(
    @Body(new ZodValidationPipe(createWorkInputSchema)) body: CreateWorkInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.worksService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.worksService.listMine(user.sub);
  }

  @Get(":id")
  getOne(
    @Param("id", new ZodValidationPipe(workIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.worksService.getMine(user.sub, id);
  }

  @Get(":id/diario")
  diario(
    @Param("id", new ZodValidationPipe(workIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.worksService.listDiario(user.sub, id);
  }

  @Get(":id/financeiro")
  financeiro(
    @Param("id", new ZodValidationPipe(workIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.worksService.getPainelFinanceiro(user.sub, id);
  }

  /** Prestadores cadastrados/avaliados nesta obra (dono ou equipe, só leitura). */
  @Get(":id/avaliacoes-prestadores")
  async avaliacoesPrestadores(
    @Param("id", new ZodValidationPipe(workIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.worksService.assertVisible(user.sub, id);
    return this.avaliacoesService.listByObra(id);
  }

  @Patch(":id")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  update(
    @Param("id", new ZodValidationPipe(workIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateWorkInputSchema)) body: UpdateWorkInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.worksService.update(user.sub, id, body);
  }
}
