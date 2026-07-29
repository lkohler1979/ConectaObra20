import { Controller, Get, Query } from "@nestjs/common";
import {
  searchFornecedoresQuerySchema,
  searchPrestadoresQuerySchema,
  searchProdutosQuerySchema,
  type SearchFornecedoresQuery,
  type SearchPrestadoresQuery,
  type SearchProdutosQuery,
} from "@conectaobra/types/search";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { MeilisearchService } from "./meilisearch.service";

/**
 * Busca de marketplace (E2-01/E2-02) — navegação livre de prestadores/
 * fornecedores/produtos, diferente do matching automático de RFQ (E3-03).
 * Público de propósito (resolve P-034): visitante sem conta busca antes de
 * cadastrar, e as páginas públicas de perfil (E2-03) já existem pra ele
 * chegar. Sem dado sensível, e ainda coberto pelo rate-limit global
 * (ThrottlerGuard).
 */
@Controller("search")
export class SearchController {
  constructor(private readonly meilisearch: MeilisearchService) {}

  @Get("prestadores")
  searchPrestadores(
    @Query(new ZodValidationPipe(searchPrestadoresQuerySchema)) query: SearchPrestadoresQuery,
  ) {
    return this.meilisearch.searchPrestadores(query.q, query.categoria, query.limit);
  }

  @Get("fornecedores")
  searchFornecedores(
    @Query(new ZodValidationPipe(searchFornecedoresQuerySchema)) query: SearchFornecedoresQuery,
  ) {
    return this.meilisearch.searchFornecedores(query.q, query.categoria, query.regiao, query.limit);
  }

  @Get("produtos")
  searchProdutos(
    @Query(new ZodValidationPipe(searchProdutosQuerySchema)) query: SearchProdutosQuery,
  ) {
    return this.meilisearch.searchProdutos(query.q, query.categoria, query.fornecedorId, query.limit);
  }
}
