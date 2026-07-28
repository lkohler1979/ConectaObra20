import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { RfqController } from "./rfq.controller";
import { RfqService } from "./rfq.service";

@Module({
  imports: [AuditLogModule],
  controllers: [RfqController],
  providers: [RfqService],
})
export class RfqModule {}
