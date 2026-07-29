import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createMilestoneInputSchema,
  entregarMilestoneInputSchema,
  milestoneIdSchema,
  type CreateMilestoneInput,
  type EntregarMilestoneInput,
} from "@conectaobra/types/milestones";
import { contractIdSchema } from "@conectaobra/types/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { MilestonesService } from "./milestones.service";

@Controller("contracts/:contractId/milestones")
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  create(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Body(new ZodValidationPipe(createMilestoneInputSchema)) body: CreateMilestoneInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.milestonesService.create(contractId, user.sub, body);
  }

  @Get()
  list(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.milestonesService.listForContract(contractId, user.sub);
  }

  @Patch(":id/iniciar")
  iniciar(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Param("id", new ZodValidationPipe(milestoneIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.milestonesService.iniciar(contractId, id, user.sub);
  }

  @Patch(":id/entregar")
  entregar(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Param("id", new ZodValidationPipe(milestoneIdSchema)) id: string,
    @Body(new ZodValidationPipe(entregarMilestoneInputSchema)) body: EntregarMilestoneInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.milestonesService.entregar(contractId, id, user.sub, body);
  }

  @Patch(":id/aprovar")
  aprovar(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Param("id", new ZodValidationPipe(milestoneIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.milestonesService.aprovar(contractId, id, user.sub);
  }
}
