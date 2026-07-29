import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { SearchModule } from "../search/search.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [AuditLogModule, SearchModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class CatalogModule {}
