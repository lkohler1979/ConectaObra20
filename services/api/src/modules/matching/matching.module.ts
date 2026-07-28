import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { MatchingService } from "./matching.service";

@Module({
  imports: [AuditLogModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
