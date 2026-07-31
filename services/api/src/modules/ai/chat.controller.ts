import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { chatInputSchema, conversaIdSchema, type ChatInput } from "@conectaobra/types/ai-chat";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { AiChatService } from "./chat.service";

/**
 * Chat do "Engenheiro Virtual" (E5-03) — resposta SIMULADA, ver `AiChatService`.
 * Sem streaming real ainda (depende do Claude API/`ANTHROPIC_API_KEY`) —
 * resposta vem inteira de uma vez.
 */
@Controller("ai/chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  chat(
    @Body(new ZodValidationPipe(chatInputSchema)) body: ChatInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.aiChatService.chat(user.sub, body);
  }

  @Get()
  listMine(@CurrentUser() user: JwtPayload) {
    return this.aiChatService.listMine(user.sub);
  }

  @Get(":id")
  getOne(
    @Param("id", new ZodValidationPipe(conversaIdSchema)) conversaId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.aiChatService.getOne(user.sub, conversaId);
  }
}
