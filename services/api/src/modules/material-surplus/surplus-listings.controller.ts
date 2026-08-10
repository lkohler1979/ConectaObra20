import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createSurplusListingInputSchema,
  mySurplusListingsQuerySchema,
  surplusListingIdSchema,
  updateSurplusListingInputSchema,
  type CreateSurplusListingInput,
  type MySurplusListingsQuery,
  type UpdateSurplusListingInput,
} from "@conectaobra/types/material-surplus";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { SurplusListingsService } from "./surplus-listings.service";

/** Anúncios do próprio cliente (autenticado) — ver surplus-public.controller.ts pro lado público. */
@Controller("surplus-listings")
@UseGuards(JwtAuthGuard)
export class SurplusListingsController {
  constructor(private readonly surplusListings: SurplusListingsService) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  create(
    @Body(new ZodValidationPipe(createSurplusListingInputSchema)) body: CreateSurplusListingInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.surplusListings.create(user.sub, body);
  }

  @Get("mine")
  listMine(
    @Query(new ZodValidationPipe(mySurplusListingsQuerySchema)) query: MySurplusListingsQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.surplusListings.listMine(user.sub, query.workId);
  }

  @Patch(":id")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  updateStatus(
    @Param("id", new ZodValidationPipe(surplusListingIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateSurplusListingInputSchema)) body: UpdateSurplusListingInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.surplusListings.updateStatus(user.sub, id, body);
  }
}
