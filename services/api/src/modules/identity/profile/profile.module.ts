import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../../common/audit/audit-log.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioService } from "./portfolio.service";

@Module({
  imports: [AuditLogModule],
  controllers: [ProfileController, PortfolioController],
  providers: [ProfileService, PortfolioService],
})
export class ProfileModule {}
