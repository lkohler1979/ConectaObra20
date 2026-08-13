import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createRfqInputSchema,
  rfqIdSchema,
  updateRfqInputSchema,
  type CreateRfqInput,
  type UpdateRfqInput,
} from "@conectaobra/types/rfq";
import {
  createRfqProposalInputSchema,
  type CreateRfqProposalInput,
} from "@conectaobra/types/rfq-proposals";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { RfqProposalService } from "./rfq-proposal.service";
import { RfqService } from "./rfq.service";

@Controller("rfq")
@UseGuards(JwtAuthGuard)
export class RfqController {
  constructor(
    private readonly rfqService: RfqService,
    private readonly rfqProposalService: RfqProposalService,
  ) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  create(
    @Body(new ZodValidationPipe(createRfqInputSchema)) body: CreateRfqInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.rfqService.listMine(user.sub);
  }

  /** Precisa vir antes de ":id" — senão o Nest casaria "discover" como :id. */
  @Get("discover")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("PRESTADOR", "TECNICO")
  discover(@CurrentUser() user: JwtPayload) {
    return this.rfqService.discoverForPrestador(user.sub);
  }

  /** "Minhas propostas" (Kanban) — mesmo cuidado de ordem que "discover". */
  @Get("proposals/mine")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("PRESTADOR", "TECNICO")
  listMyProposals(@CurrentUser() user: JwtPayload) {
    return this.rfqProposalService.listMine(user.sub);
  }

  @Get(":id")
  getOne(
    @Param("id", new ZodValidationPipe(rfqIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqService.getMine(user.sub, id);
  }

  @Patch(":id")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("CLIENTE_PF", "CLIENTE_PJ")
  update(
    @Param("id", new ZodValidationPipe(rfqIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateRfqInputSchema)) body: UpdateRfqInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqService.update(user.sub, id, body);
  }

  @Post(":id/proposals")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("PRESTADOR", "TECNICO")
  submitProposal(
    @Param("id", new ZodValidationPipe(rfqIdSchema)) id: string,
    @Body(new ZodValidationPipe(createRfqProposalInputSchema)) body: CreateRfqProposalInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqProposalService.submit(id, user.sub, body);
  }

  /** Dono do RFQ vê todas as propostas; prestador vê só a própria. */
  @Get(":id/proposals")
  listProposals(
    @Param("id", new ZodValidationPipe(rfqIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqProposalService.listForRfq(id, user.sub);
  }
}
