import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AnalyticsModule } from "../../common/analytics/analytics.module";
import { EscrowController } from "./escrow.controller";
import { EscrowService } from "./escrow.service";
import { DisputesController } from "./disputes.controller";
import { DisputesService } from "./disputes.service";
import { ExtratoFinanceiroController } from "./extrato-financeiro.controller";

@Module({
  imports: [AuditLogModule, AnalyticsModule],
  controllers: [EscrowController, DisputesController, ExtratoFinanceiroController],
  providers: [EscrowService, DisputesService],
  exports: [EscrowService],
})
export class EscrowModule {}
