import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { sinapiSearchQuerySchema, type SinapiSearchQuery } from "@conectaobra/types/sinapi";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import { SinapiCacheService } from "./sinapi-cache.service";

/** Busca de SINAPI (a pedido do usuário) — qualquer tipo logado usa, mesmo padrão de /ai/analisar-orcamento. */
@Controller("sinapi")
@UseGuards(JwtAuthGuard)
export class SinapiController {
  constructor(private readonly sinapiCacheService: SinapiCacheService) {}

  @Get("search")
  search(@Query(new ZodValidationPipe(sinapiSearchQuerySchema)) query: SinapiSearchQuery) {
    return this.sinapiCacheService.buscar(query);
  }
}
