import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AnalyticsModule } from "../../common/analytics/analytics.module";
import { SearchModule } from "../search/search.module";
import { EscrowModule } from "../escrow/escrow.module";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { ContractReviewsController } from "./contract-reviews.controller";
import { MyReviewsController } from "./my-reviews.controller";
import { ReviewsService } from "./reviews.service";
import { MilestonesController } from "./milestones.controller";
import { MilestonesService } from "./milestones.service";
import { MILESTONE_TIMEOUT_QUEUE, MilestoneTimeoutService } from "./milestone-timeout.service";
import { MilestoneTimeoutProcessor } from "./milestone-timeout.processor";

@Module({
  imports: [
    AuditLogModule,
    AnalyticsModule,
    SearchModule,
    EscrowModule,
    BullModule.registerQueue({ name: MILESTONE_TIMEOUT_QUEUE }),
  ],
  controllers: [
    ContractsController,
    ContractReviewsController,
    MyReviewsController,
    MilestonesController,
  ],
  providers: [
    ContractsService,
    ReviewsService,
    MilestonesService,
    MilestoneTimeoutService,
    MilestoneTimeoutProcessor,
  ],
})
export class ContractsModule {}
