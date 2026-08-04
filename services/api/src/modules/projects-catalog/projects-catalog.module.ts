import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { CatalogProjectsController } from "./catalog-projects.controller";
import { CatalogProjectsService } from "./catalog-projects.service";
import { PublicCatalogProjectsController } from "./public-catalog-projects.controller";
import { PublicCatalogProjectsService } from "./public-catalog-projects.service";
import { CatalogPurchasesController } from "./catalog-purchases.controller";
import { CatalogPurchasesService } from "./catalog-purchases.service";
import { WatermarkService } from "./watermark.service";

@Module({
  imports: [AuditLogModule],
  controllers: [
    CatalogProjectsController,
    PublicCatalogProjectsController,
    CatalogPurchasesController,
  ],
  providers: [
    CatalogProjectsService,
    PublicCatalogProjectsService,
    CatalogPurchasesService,
    WatermarkService,
  ],
})
export class ProjectsCatalogModule {}
