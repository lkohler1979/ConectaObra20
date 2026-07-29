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
  createPortfolioItemInputSchema,
  portfolioItemIdSchema,
  updatePortfolioItemInputSchema,
  type CreatePortfolioItemInput,
  type UpdatePortfolioItemInput,
} from "@conectaobra/types/portfolio";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../../common/guards/user-type.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { PortfolioService } from "./portfolio.service";

/** Também usado por TECNICO — mesmo critério de profiles_prestador (ver profile.controller.ts). */
@Controller("profile/prestador/portfolio")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("PRESTADOR", "TECNICO")
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createPortfolioItemInputSchema)) body: CreatePortfolioItemInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.portfolioService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.portfolioService.listMine(user.sub);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(portfolioItemIdSchema)) id: string,
    @Body(new ZodValidationPipe(updatePortfolioItemInputSchema)) body: UpdatePortfolioItemInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.portfolioService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ZodValidationPipe(portfolioItemIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.portfolioService.remove(user.sub, id);
  }
}
