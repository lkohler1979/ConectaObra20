import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { CatalogProjectsController } from "./catalog-projects.controller";
import { CatalogProjectsService } from "./catalog-projects.service";
import { PublicCatalogProjectsController } from "./public-catalog-projects.controller";
import { PublicCatalogProjectsService } from "./public-catalog-projects.service";

@Module({
  imports: [AuditLogModule],
  controllers: [CatalogProjectsController, PublicCatalogProjectsController],
  providers: [CatalogProjectsService, PublicCatalogProjectsService],
})
export class ProjectsCatalogModule {}
