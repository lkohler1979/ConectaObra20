import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { createAvaliacaoInputSchema, type CreateAvaliacaoInput } from "@conectaobra/types/avaliacoes";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { AvaliacoesService } from "./avaliacoes.service";

@Controller("avaliacoes")
@UseGuards(JwtAuthGuard)
export class AvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createAvaliacaoInputSchema)) body: CreateAvaliacaoInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.avaliacoesService.criarOuAtualizar(user.sub, body);
  }
}
