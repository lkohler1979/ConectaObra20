import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  addTeamMemberInputSchema,
  teamMemberUserIdSchema,
  type AddTeamMemberInput,
} from "@conectaobra/types/equipe";
import { workIdSchema } from "@conectaobra/types/works";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { WorkTeamService } from "./work-team.service";

@Controller("works/:id/equipe")
@UseGuards(JwtAuthGuard)
export class WorkTeamController {
  constructor(private readonly workTeamService: WorkTeamService) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  add(
    @Param("id", new ZodValidationPipe(workIdSchema)) workId: string,
    @Body(new ZodValidationPipe(addTeamMemberInputSchema)) body: AddTeamMemberInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workTeamService.add(user.sub, workId, body);
  }

  @Get()
  list(
    @Param("id", new ZodValidationPipe(workIdSchema)) workId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workTeamService.list(user.sub, workId);
  }

  @Delete(":userId")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  remove(
    @Param("id", new ZodValidationPipe(workIdSchema)) workId: string,
    @Param("userId", new ZodValidationPipe(teamMemberUserIdSchema)) userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workTeamService.remove(user.sub, workId, userId);
  }
}
