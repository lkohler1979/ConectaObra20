import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../../common/audit/audit-log.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
  imports: [AuditLogModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
