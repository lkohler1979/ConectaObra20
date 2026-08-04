import { Module } from "@nestjs/common";
import { AuditLogModule } from "../../common/audit/audit-log.module";
import { AuthModule } from "../identity/auth/auth.module";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";

@Module({
  imports: [AuditLogModule, AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminModule {}
