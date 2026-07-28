import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { WorksController } from "./works.controller";
import { WorksService } from "./works.service";

@Module({
  imports: [AuditLogModule],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
