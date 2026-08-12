import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AvaliacoesController } from "./avaliacoes.controller";
import { PublicAvaliacoesController } from "./public-avaliacoes.controller";
import { AvaliacoesService } from "./avaliacoes.service";

@Module({
  imports: [AuditLogModule],
  controllers: [AvaliacoesController, PublicAvaliacoesController],
  providers: [AvaliacoesService],
  // WorksController usa pra expor GET /works/:id/avaliacoes-prestadores.
  exports: [AvaliacoesService],
})
export class AvaliacoesModule {}
