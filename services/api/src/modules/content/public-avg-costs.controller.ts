import { Controller, Get, Query } from "@nestjs/common";
import {
  listPublicAvgCostsQuerySchema,
  type ListPublicAvgCostsQuery,
} from "@conectaobra/types/ai-budget";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicAvgCostsService } from "./public-avg-costs.service";

/** Tabela dinâmica de custos médios por cidade (E9-03) — sem login. */
@Controller("public/avg-costs")
export class PublicAvgCostsController {
  constructor(private readonly publicAvgCosts: PublicAvgCostsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPublicAvgCostsQuerySchema)) query: ListPublicAvgCostsQuery,
  ) {
    return this.publicAvgCosts.list(query);
  }
}
