import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { EscrowService } from "./escrow.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ExtratoFinanceiroController {
  constructor(private readonly escrowService: EscrowService) {}

  /** Extrato financeiro do prestador/fornecedor (E4-12) — sempre o próprio. */
  @Get("extrato-financeiro")
  getExtrato(@CurrentUser() user: JwtPayload) {
    return this.escrowService.getExtrato(user.sub);
  }
}
