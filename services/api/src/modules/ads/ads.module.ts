import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AdsController } from "./ads.controller";
import { AdsService } from "./ads.service";
import { PublicAdsController } from "./public-ads.controller";
import { PublicAdsService } from "./public-ads.service";

@Module({
  imports: [AuditLogModule],
  controllers: [AdsController, PublicAdsController],
  providers: [AdsService, PublicAdsService],
})
export class AdsModule {}
