import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  purchaseQuoteIdSchema,
  respondPurchaseQuoteInputSchema,
  type RespondPurchaseQuoteInput,
} from "@conectaobra/types/purchase-quotes";
import { materialListIdSchema } from "@conectaobra/types/material-lists";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { PurchaseQuotesService } from "./purchase-quotes.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class PurchaseQuotesController {
  constructor(private readonly purchaseQuotesService: PurchaseQuotesService) {}

  @Post("material-lists/:id/quote")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  requestQuotes(
    @Param("id", new ZodValidationPipe(materialListIdSchema)) materialListId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseQuotesService.requestQuotes(user.sub, materialListId);
  }

  @Get("material-lists/:id/quotes")
  listForMaterialList(
    @Param("id", new ZodValidationPipe(materialListIdSchema)) materialListId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseQuotesService.listForMaterialList(user.sub, materialListId);
  }

  @Get("material-lists/:id/comparison")
  getComparison(
    @Param("id", new ZodValidationPipe(materialListIdSchema)) materialListId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseQuotesService.getComparison(user.sub, materialListId);
  }

  @Get("purchase-quotes")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  listMine(@CurrentUser() user: JwtPayload) {
    return this.purchaseQuotesService.listMine(user.sub);
  }

  @Patch("purchase-quotes/:id")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  respond(
    @Param("id", new ZodValidationPipe(purchaseQuoteIdSchema)) quoteId: string,
    @Body(new ZodValidationPipe(respondPurchaseQuoteInputSchema)) body: RespondPurchaseQuoteInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseQuotesService.respond(user.sub, quoteId, body);
  }

  /** Checkout simulado (E7-04) — sempre sucesso, sem PSP real (P-002). */
  @Post("purchase-quotes/:id/checkout")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  checkout(
    @Param("id", new ZodValidationPipe(purchaseQuoteIdSchema)) quoteId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseQuotesService.checkout(user.sub, quoteId);
  }
}
