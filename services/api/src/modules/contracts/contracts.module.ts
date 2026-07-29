import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { ContractReviewsController } from "./contract-reviews.controller";
import { MyReviewsController } from "./my-reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [AuditLogModule],
  controllers: [ContractsController, ContractReviewsController, MyReviewsController],
  providers: [ContractsService, ReviewsService],
})
export class ContractsModule {}
