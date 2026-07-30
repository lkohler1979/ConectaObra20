import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { contractIdSchema } from "@conectaobra/types/contracts";
import { milestoneIdSchema } from "@conectaobra/types/milestones";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { EscrowService } from "./escrow.service";

@Controller("contracts/:contractId")
@UseGuards(JwtAuthGuard)
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  /** Depósito simulado (E4-04) — sempre sucesso, sem PSP real (P-002). */
  @Post("milestones/:id/deposito")
  depositar(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Param("id", new ZodValidationPipe(milestoneIdSchema)) milestoneId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.escrowService.depositar(user.sub, contractId, milestoneId);
  }

  @Get("escrow")
  getLedger(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.escrowService.getLedger(user.sub, contractId);
  }
}
