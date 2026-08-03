import { Controller, Get, Query } from "@nestjs/common";
import {
  listPublicIndicatorsQuerySchema,
  type ListPublicIndicatorsQuery,
} from "@conectaobra/types/indicators";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicIndicatorsService } from "./public-indicators.service";

/** Indicadores de mercado (E9-02) — sem login. */
@Controller("public/indicators")
export class PublicIndicatorsController {
  constructor(private readonly publicIndicators: PublicIndicatorsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPublicIndicatorsQuerySchema))
    query: ListPublicIndicatorsQuery,
  ) {
    return this.publicIndicators.list(query);
  }
}
