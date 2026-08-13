import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AuthModule } from "../identity/auth/auth.module";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminKpisController } from "./admin-kpis.controller";
import { AdminKpisService } from "./admin-kpis.service";
import { AdminAvaliacoesController } from "./admin-avaliacoes.controller";
import { AdminAvaliacoesService } from "./admin-avaliacoes.service";

@Module({
  imports: [AuditLogModule, AuthModule],
  controllers: [AdminUsersController, AdminKpisController, AdminAvaliacoesController],
  providers: [AdminUsersService, AdminKpisService, AdminAvaliacoesService],
})
export class AdminModule {}
