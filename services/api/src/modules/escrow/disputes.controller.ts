import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  abrirDisputeInputSchema,
  disputeIdSchema,
  resolverDisputeInputSchema,
  type AbrirDisputeInput,
  type ResolverDisputeInput,
} from "@conectaobra/types/disputes";
import { contractIdSchema } from "@conectaobra/types/contracts";
import { milestoneIdSchema } from "@conectaobra/types/milestones";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { DisputesService } from "./disputes.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post("contracts/:contractId/milestones/:id/disputas")
  abrir(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Param("id", new ZodValidationPipe(milestoneIdSchema)) milestoneId: string,
    @Body(new ZodValidationPipe(abrirDisputeInputSchema)) body: AbrirDisputeInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disputesService.abrir(user.sub, contractId, milestoneId, body);
  }

  @Get("contracts/:contractId/milestones/:id/disputas")
  listForMilestone(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Param("id", new ZodValidationPipe(milestoneIdSchema)) milestoneId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disputesService.listForMilestone(user.sub, contractId, milestoneId);
  }

  /** Fila de mediação — exclusiva do ADMIN. */
  @Get("disputas")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("ADMIN")
  listAbertas() {
    return this.disputesService.listAbertas();
  }

  /** Mediação (E4-09/E4-10) — exclusiva do ADMIN. */
  @Patch("disputas/:id/resolver")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("ADMIN")
  resolver(
    @Param("id", new ZodValidationPipe(disputeIdSchema)) disputeId: string,
    @Body(new ZodValidationPipe(resolverDisputeInputSchema)) body: ResolverDisputeInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disputesService.resolver(user.sub, disputeId, body);
  }
}
