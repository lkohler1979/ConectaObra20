import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../../common/audit/audit-log.module";
import { SearchModule } from "../../search/search.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioService } from "./portfolio.service";
import { LojasController } from "./lojas.controller";
import { LojasService } from "./lojas.service";
import { PromocoesController } from "./promocoes.controller";
import { PromocoesService } from "./promocoes.service";

@Module({
  imports: [AuditLogModule, SearchModule],
  controllers: [ProfileController, PortfolioController, LojasController, PromocoesController],
  providers: [ProfileService, PortfolioService, LojasService, PromocoesService],
})
export class ProfileModule {}
