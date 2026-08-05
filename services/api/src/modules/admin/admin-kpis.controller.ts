import { Controller, Get, UseGuards } from "@nestjs/common";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import { AdminKpisService } from "./admin-kpis.service";

/** Dashboard de KPIs do PRD (E10-03) — exclusivo do ADMIN. */
@Controller("admin/kpis")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("ADMIN")
export class AdminKpisController {
  constructor(private readonly adminKpisService: AdminKpisService) {}

  @Get()
  compute() {
    return this.adminKpisService.compute();
  }
}
