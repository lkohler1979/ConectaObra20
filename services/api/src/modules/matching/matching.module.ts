import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MatchingService } from "./matching.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
