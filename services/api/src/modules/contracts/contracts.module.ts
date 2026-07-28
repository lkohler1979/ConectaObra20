import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";

@Module({
  imports: [AuditLogModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
