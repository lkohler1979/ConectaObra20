import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { projectIdSchema } from "@conectaobra/types/projects-catalog";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { CatalogPurchasesService } from "./catalog-purchases.service";

/** Compra de plantas do catálogo (E9-05 parte 2) — qualquer usuário autenticado pode comprar. */
@Controller()
@UseGuards(JwtAuthGuard)
export class CatalogPurchasesController {
  constructor(private readonly catalogPurchasesService: CatalogPurchasesService) {}

  @Post("catalog/projects/:id/buy")
  @HttpCode(HttpStatus.CREATED)
  buy(
    @Param("id", new ZodValidationPipe(projectIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogPurchasesService.buy(user.sub, id);
  }

  @Get("catalog/purchases")
  listMine(@CurrentUser() user: JwtPayload) {
    return this.catalogPurchasesService.listMine(user.sub);
  }
}
