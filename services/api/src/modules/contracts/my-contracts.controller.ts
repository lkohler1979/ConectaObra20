import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { ContractsService } from "./contracts.service";

/** "Meus contratos" — cliente e prestador/fornecedor usam o mesmo endpoint. */
@Controller("contracts")
@UseGuards(JwtAuthGuard)
export class MyContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  listMine(@CurrentUser() user: JwtPayload) {
    return this.contractsService.listMine(user.sub);
  }
}
