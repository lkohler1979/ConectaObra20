import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { SearchModule } from "../search/search.module";
import { EscrowModule } from "../escrow/escrow.module";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { ContractReviewsController } from "./contract-reviews.controller";
import { MyReviewsController } from "./my-reviews.controller";
import { ReviewsService } from "./reviews.service";
import { MilestonesController } from "./milestones.controller";
import { MilestonesService } from "./milestones.service";

@Module({
  imports: [AuditLogModule, SearchModule, EscrowModule],
  controllers: [
    ContractsController,
    ContractReviewsController,
    MyReviewsController,
    MilestonesController,
  ],
  providers: [ContractsService, ReviewsService, MilestonesService],
})
export class ContractsModule {}
