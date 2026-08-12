import { Controller, Get, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { publicProfileIdSchema } from "@conectaobra/types/public-profiles";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AvaliacoesService } from "./avaliacoes.service";

const obraIdQuerySchema = z.object({ obraId: z.string().uuid().optional() });
type ObraIdQuery = z.infer<typeof obraIdQuerySchema>;

/** Sem guard, de propósito — mesmo padrão de PublicProfilesController (E2-03). */
@Controller("public")
export class PublicAvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @Get("prestadores/:id/avaliacoes")
  async listPrestador(
    @Param("id", new ZodValidationPipe(publicProfileIdSchema)) id: string,
    @Query(new ZodValidationPipe(obraIdQuerySchema)) query: ObraIdQuery,
  ) {
    const [resumo, itens] = await Promise.all([
      this.avaliacoesService.resumoPrestador(id, query.obraId),
      this.avaliacoesService.listByPrestador(id, query.obraId),
    ]);
    return { resumo, itens };
  }

  @Get("fornecedores/:id/avaliacoes")
  async listFornecedor(@Param("id", new ZodValidationPipe(publicProfileIdSchema)) id: string) {
    const [resumo, itens] = await Promise.all([
      this.avaliacoesService.resumoFornecedor(id),
      this.avaliacoesService.listByFornecedor(id),
    ]);
    return { resumo, itens };
  }

  @Get("produtos/:id/avaliacoes")
  async listProduto(@Param("id", new ZodValidationPipe(publicProfileIdSchema)) id: string) {
    const [resumo, itens] = await Promise.all([
      this.avaliacoesService.resumoProduto(id),
      this.avaliacoesService.listByProduto(id),
    ]);
    return { resumo, itens };
  }
}
