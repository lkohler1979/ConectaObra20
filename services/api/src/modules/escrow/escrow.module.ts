import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { EscrowController } from "./escrow.controller";
import { EscrowService } from "./escrow.service";

@Module({
  imports: [AuditLogModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
