import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { ArticlesController } from "./articles.controller";
import { ArticlesService } from "./articles.service";
import { PublicArticlesController } from "./public-articles.controller";
import { PublicArticlesService } from "./public-articles.service";

@Module({
  imports: [AuditLogModule],
  controllers: [ArticlesController, PublicArticlesController],
  providers: [ArticlesService, PublicArticlesService],
})
export class ContentModule {}
