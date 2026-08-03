import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  upsertIndicatorInputSchema,
  type UpsertIndicatorInput,
} from "@conectaobra/types/indicators";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { IndicatorsService } from "./indicators.service";

/** Indicadores de mercado (E9-02) — cadastro exclusivo do ADMIN. */
@Controller("indicators")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("ADMIN")
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  upsert(
    @Body(new ZodValidationPipe(upsertIndicatorInputSchema)) body: UpsertIndicatorInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.indicatorsService.upsert(user.sub, body);
  }
}
