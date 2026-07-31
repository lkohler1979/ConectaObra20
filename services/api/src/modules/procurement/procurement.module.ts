import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { WorksModule } from "../works/works.module";
import { AiModule } from "../ai/ai.module";
import { MaterialListsController } from "./material-lists.controller";
import { MaterialListsService } from "./material-lists.service";
import { PurchaseQuotesController } from "./purchase-quotes.controller";
import { PurchaseQuotesService } from "./purchase-quotes.service";

@Module({
  imports: [AuditLogModule, WorksModule, AiModule],
  controllers: [MaterialListsController, PurchaseQuotesController],
  providers: [MaterialListsService, PurchaseQuotesService],
})
export class ProcurementModule {}
