import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  searchFornecedoresQuerySchema,
  searchPrestadoresQuerySchema,
  searchProdutosQuerySchema,
  type SearchFornecedoresQuery,
  type SearchPrestadoresQuery,
  type SearchProdutosQuery,
} from "@conectaobra/types/search";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import { MeilisearchService } from "./meilisearch.service";

/**
 * Busca de marketplace (E2-01/E2-02) — navegação livre de prestadores/
 * fornecedores/produtos, diferente do matching automático de RFQ (E3-03).
 * Autenticado por enquanto (mesmo padrão do resto da API); tornar público
 * fica pra quando existir uma página pública de fato (E2-03).
 */
@Controller("search")
@UseGuards(JwtAuthGuard)
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
