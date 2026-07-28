import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { MatchingModule } from "../matching/matching.module";
import { RfqController } from "./rfq.controller";
import { RfqService } from "./rfq.service";

@Module({
  imports: [AuditLogModule, MatchingModule],
  controllers: [RfqController],
  providers: [RfqService],
})
export class RfqModule {}
