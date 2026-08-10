import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
  surplusCheckoutInputSchema,
  surplusListingIdSchema,
  surplusListingsQuerySchema,
  type SurplusCheckoutInput,
  type SurplusListingsQuery,
} from "@conectaobra/types/material-surplus";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SurplusListingsService } from "./surplus-listings.service";

/**
 * Marketplace público de sobra de material — mesmo padrão de
 * public-profiles.controller.ts/search.controller.ts: sem JwtAuthGuard de
 * propósito, visitante sem conta navega e compra (checkout de convidado).
 * Sem dado sensível do anunciante além do nome; ainda coberto pelo
 * rate-limit global (ThrottlerGuard).
 */
@Controller("public/surplus-listings")
export class SurplusPublicController {
  constructor(private readonly surplusListings: SurplusListingsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(surplusListingsQuerySchema)) query: SurplusListingsQuery) {
    return this.surplusListings.listPublic(query);
  }

  @Get(":id")
  getOne(@Param("id", new ZodValidationPipe(surplusListingIdSchema)) id: string) {
    return this.surplusListings.getPublic(id);
  }

  @Post(":id/checkout")
  checkout(
    @Param("id", new ZodValidationPipe(surplusListingIdSchema)) id: string,
    @Body(new ZodValidationPipe(surplusCheckoutInputSchema)) body: SurplusCheckoutInput,
  ) {
    return this.surplusListings.checkout(id, body);
  }
}
