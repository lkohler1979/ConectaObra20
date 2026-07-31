import { Controller, Get, Query } from "@nestjs/common";
import {
  listPublicPromocoesQuerySchema,
  type ListPublicPromocoesQuery,
} from "@conectaobra/types/promocoes";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicPromocoesService } from "./public-promocoes.service";

/**
 * Página pública de promoções (sem login) — link direto na home, mais o
 * filtro `?destaque=true` usado pra puxar os destaques exibidos na própria home.
 */
@Controller("public/promocoes")
export class PublicPromocoesController {
  constructor(private readonly publicPromocoes: PublicPromocoesService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPublicPromocoesQuerySchema)) query: ListPublicPromocoesQuery,
  ) {
    return this.publicPromocoes.list(query);
  }
}
