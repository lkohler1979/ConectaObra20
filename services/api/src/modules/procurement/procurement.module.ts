import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { WorksModule } from "../works/works.module";
import { MaterialListsController } from "./material-lists.controller";
import { MaterialListsService } from "./material-lists.service";

@Module({
  imports: [AuditLogModule, WorksModule],
  controllers: [MaterialListsController],
  providers: [MaterialListsService],
})
export class ProcurementModule {}
