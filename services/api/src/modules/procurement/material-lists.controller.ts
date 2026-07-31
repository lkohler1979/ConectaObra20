import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createMaterialListInputSchema,
  gerarListaMateriaisInputSchema,
  listMaterialListsQuerySchema,
  materialListIdSchema,
  updateMaterialListInputSchema,
  type CreateMaterialListInput,
  type GerarListaMateriaisInput,
  type ListMaterialListsQuery,
  type UpdateMaterialListInput,
} from "@conectaobra/types/material-lists";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { MaterialListsService } from "./material-lists.service";

@Controller("material-lists")
@UseGuards(JwtAuthGuard)
export class MaterialListsController {
  constructor(private readonly materialListsService: MaterialListsService) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  create(
    @Body(new ZodValidationPipe(createMaterialListInputSchema)) body: CreateMaterialListInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.materialListsService.create(user.sub, body);
  }

  /** Geração via IA SIMULADA (E5-07) — ver MaterialGeneratorService. */
  @Post("gerar-ia")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  gerarComIA(
    @Body(new ZodValidationPipe(gerarListaMateriaisInputSchema)) body: GerarListaMateriaisInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.materialListsService.gerarComIA(user.sub, body);
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(listMaterialListsQuerySchema)) query: ListMaterialListsQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.materialListsService.listForObra(user.sub, query.obraId);
  }

  @Get(":id")
  getOne(
    @Param("id", new ZodValidationPipe(materialListIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.materialListsService.getOne(user.sub, id);
  }

  @Patch(":id")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  update(
    @Param("id", new ZodValidationPipe(materialListIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateMaterialListInputSchema)) body: UpdateMaterialListInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.materialListsService.update(user.sub, id, body);
  }
}
