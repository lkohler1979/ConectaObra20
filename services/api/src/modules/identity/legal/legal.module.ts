import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../../common/audit/audit-log.module";
import { ConsentService } from "./consent.service";
import { LegalController } from "./legal.controller";

@Module({
  imports: [AuditLogModule],
  controllers: [LegalController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class LegalModule {}
