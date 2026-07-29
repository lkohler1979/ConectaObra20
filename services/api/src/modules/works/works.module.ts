import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { WorksController } from "./works.controller";
import { WorksService } from "./works.service";
import { WorkTeamController } from "./work-team.controller";
import { WorkTeamService } from "./work-team.service";

@Module({
  imports: [AuditLogModule],
  controllers: [WorksController, WorkTeamController],
  providers: [WorksService, WorkTeamService],
  exports: [WorksService],
})
export class WorksModule {}
