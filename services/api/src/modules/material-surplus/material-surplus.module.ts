import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { SurplusListingsController } from "./surplus-listings.controller";
import { SurplusPublicController } from "./surplus-public.controller";
import { SurplusListingsService } from "./surplus-listings.service";

@Module({
  imports: [AuditLogModule],
  controllers: [SurplusListingsController, SurplusPublicController],
  providers: [SurplusListingsService],
})
export class MaterialSurplusModule {}
