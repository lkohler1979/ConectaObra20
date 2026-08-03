import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  createProjectInputSchema,
  projectIdSchema,
  updateProjectInputSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@conectaobra/types/projects-catalog";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { CatalogProjectsService } from "./catalog-projects.service";

/** Catálogo de plantas (E9-05) — publicação restrita a PRESTADOR/TECNICO (arquitetos/engenheiros). */
@Controller("catalog/projects")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("PRESTADOR", "TECNICO")
export class CatalogProjectsController {
  constructor(private readonly catalogProjectsService: CatalogProjectsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createProjectInputSchema)) body: CreateProjectInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogProjectsService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.catalogProjectsService.listMine(user.sub);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(projectIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateProjectInputSchema)) body: UpdateProjectInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogProjectsService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ZodValidationPipe(projectIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogProjectsService.remove(user.sub, id);
  }
}
