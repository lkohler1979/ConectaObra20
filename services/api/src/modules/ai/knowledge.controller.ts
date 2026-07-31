import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ingestKnowledgeInputSchema,
  searchKnowledgeQuerySchema,
  type IngestKnowledgeInput,
  type SearchKnowledgeQuery,
} from "@conectaobra/types/ai-knowledge";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import { KnowledgeService } from "./knowledge.service";

/**
 * Base de conhecimento (E5-01) — ingestão exclusiva do ADMIN (evita
 * conteúdo arbitrário na base curada); busca só autenticada, pra testar o
 * retrieval antes do chat (E5-03) existir de verdade.
 */
@Controller("ai/knowledge")
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("ADMIN")
  ingest(@Body(new ZodValidationPipe(ingestKnowledgeInputSchema)) body: IngestKnowledgeInput) {
    return this.knowledgeService.ingest(body);
  }

  @Get("search")
  search(@Query(new ZodValidationPipe(searchKnowledgeQuerySchema)) query: SearchKnowledgeQuery) {
    return this.knowledgeService.search(query.q, query.limit);
  }
}
