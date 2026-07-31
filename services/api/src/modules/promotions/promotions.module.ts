import { Module } from "@nestjs/common";
import { PublicPromocoesController } from "./public-promocoes.controller";
import { PublicPromocoesService } from "./public-promocoes.service";

@Module({
  controllers: [PublicPromocoesController],
  providers: [PublicPromocoesService],
})
export class PromotionsModule {}
