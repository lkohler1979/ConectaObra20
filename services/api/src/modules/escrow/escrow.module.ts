import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { EscrowController } from "./escrow.controller";
import { EscrowService } from "./escrow.service";
import { DisputesController } from "./disputes.controller";
import { DisputesService } from "./disputes.service";
import { ExtratoFinanceiroController } from "./extrato-financeiro.controller";

@Module({
  imports: [AuditLogModule],
  controllers: [EscrowController, DisputesController, ExtratoFinanceiroController],
  providers: [EscrowService, DisputesService],
  exports: [EscrowService],
})
export class EscrowModule {}
