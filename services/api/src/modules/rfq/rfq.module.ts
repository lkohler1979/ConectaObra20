import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AnalyticsModule } from "../../common/analytics/analytics.module";
import { MatchingModule } from "../matching/matching.module";
import { RfqController } from "./rfq.controller";
import { RfqProposalService } from "./rfq-proposal.service";
import { RfqService } from "./rfq.service";

@Module({
  imports: [AuditLogModule, AnalyticsModule, MatchingModule],
  controllers: [RfqController],
  providers: [RfqService, RfqProposalService],
})
export class RfqModule {}
