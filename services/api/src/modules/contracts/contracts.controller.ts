import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { proposalIdSchema } from "@conectaobra/types/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { ContractsService } from "./contracts.service";

/** Rota no plural "proposals", como no doc 02 §4 ("POST /proposals/:id/accept"). */
@Controller("proposals")
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post(":id/accept")
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  accept(
    @Param("id", new ZodValidationPipe(proposalIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.acceptProposal(id, user.sub);
  }
}
