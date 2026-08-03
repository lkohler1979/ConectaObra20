import { Controller, Get, Query } from "@nestjs/common";
import { listPublicAdsQuerySchema, type ListPublicAdsQuery } from "@conectaobra/types/ads";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicAdsService } from "./public-ads.service";

/** Anúncios exibidos na home — sem login, mesmo padrão de PublicPromocoesController. */
@Controller("public/ads")
export class PublicAdsController {
  constructor(private readonly publicAds: PublicAdsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listPublicAdsQuerySchema)) query: ListPublicAdsQuery) {
    return this.publicAds.list(query);
  }
}
