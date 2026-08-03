import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { ArticlesController } from "./articles.controller";
import { ArticlesService } from "./articles.service";
import { PublicArticlesController } from "./public-articles.controller";
import { PublicArticlesService } from "./public-articles.service";
import { IndicatorsController } from "./indicators.controller";
import { IndicatorsService } from "./indicators.service";
import { PublicIndicatorsController } from "./public-indicators.controller";
import { PublicIndicatorsService } from "./public-indicators.service";
import { PublicAvgCostsController } from "./public-avg-costs.controller";
import { PublicAvgCostsService } from "./public-avg-costs.service";

@Module({
  imports: [AuditLogModule],
  controllers: [
    ArticlesController,
    PublicArticlesController,
    IndicatorsController,
    PublicIndicatorsController,
    PublicAvgCostsController,
  ],
  providers: [
    ArticlesService,
    PublicArticlesService,
    IndicatorsService,
    PublicIndicatorsService,
    PublicAvgCostsService,
  ],
})
export class ContentModule {}
