import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Meilisearch } from "meilisearch";
import type {
  FornecedorSearchHit,
  PrestadorSearchHit,
  ProdutoSearchHit,
} from "@conectaobra/types/search";
import { env } from "../../config/env";

export const PRESTADORES_INDEX = "prestadores";
export const FORNECEDORES_INDEX = "fornecedores";
export const PRODUTOS_INDEX = "produtos";

/**
 * Wrapper best-effort sobre o client do Meilisearch (E2-01) — nenhum método
 * público propaga erro. Mesmo padrão do enfileiramento de notificações via
 * BullMQ em MatchingService: se o Meilisearch estiver fora do ar, a operação
 * principal (gravar no Postgres) não pode ser derrubada por causa disso.
 * `new Meilisearch(...)` não conecta na hora — só falha quando alguém chama
 * um método de verdade, então o boot do Nest nunca é afetado por isso.
 */
@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private readonly client = new Meilisearch({ host: env.MEILI_HOST, apiKey: env.MEILI_API_KEY });

  async onModuleInit(): Promise<void> {
    try {
      await this.client
        .index<PrestadorSearchHit>(PRESTADORES_INDEX)
        .updateFilterableAttributes(["categorias"]);
      await this.client
        .index<FornecedorSearchHit>(FORNECEDORES_INDEX)
        .updateFilterableAttributes(["categorias", "regioes"]);
      await this.client
        .index<ProdutoSearchHit>(PRODUTOS_INDEX)
        .updateFilterableAttributes(["categoria", "fornecedorId"]);
    } catch (err) {
      this.logger.warn(
        `Meilisearch indisponível no boot — índices não configurados agora (retenta na próxima escrita): ${(err as Error).message}`,
      );
    }
  }

  async indexPrestador(doc: PrestadorSearchHit): Promise<void> {
    await this.safeCall(() =>
      this.client
        .index<PrestadorSearchHit>(PRESTADORES_INDEX)
        .addDocuments([doc], { primaryKey: "userId" }),
    );
  }

  async indexFornecedor(doc: FornecedorSearchHit): Promise<void> {
    await this.safeCall(() =>
      this.client
        .index<FornecedorSearchHit>(FORNECEDORES_INDEX)
        .addDocuments([doc], { primaryKey: "userId" }),
    );
  }

  async indexProduto(doc: ProdutoSearchHit): Promise<void> {
    await this.safeCall(() =>
      this.client.index<ProdutoSearchHit>(PRODUTOS_INDEX).addDocuments([doc], { primaryKey: "id" }),
    );
  }

  async removeProduto(id: string): Promise<void> {
    await this.safeCall(() => this.client.index(PRODUTOS_INDEX).deleteDocument(id));
  }

  /**
   * `updateDocuments` faz merge parcial (diferente de `addDocuments`, que
   * substitui o documento inteiro) — usado pra atualizar só `notaMedia` sem
   * precisar reconstruir o documento completo (E2-05).
   */
  async updatePrestadorNota(userId: string, notaMedia: number): Promise<void> {
    await this.safeCall(() =>
      this.client
        .index<PrestadorSearchHit>(PRESTADORES_INDEX)
        .updateDocuments([{ userId, notaMedia }], { primaryKey: "userId" }),
    );
  }

  async updateFornecedorNota(userId: string, notaMedia: number): Promise<void> {
    await this.safeCall(() =>
      this.client
        .index<FornecedorSearchHit>(FORNECEDORES_INDEX)
        .updateDocuments([{ userId, notaMedia }], { primaryKey: "userId" }),
    );
  }

  async searchPrestadores(
    q: string | undefined,
    categoria: string | undefined,
    limit: number,
  ): Promise<PrestadorSearchHit[]> {
    return this.safeSearch(() =>
      this.client.index<PrestadorSearchHit>(PRESTADORES_INDEX).search(q ?? "", {
        filter: categoria ? `categorias = "${categoria}"` : undefined,
        limit,
      }),
    );
  }

  async searchFornecedores(
    q: string | undefined,
    categoria: string | undefined,
    regiao: string | undefined,
    limit: number,
  ): Promise<FornecedorSearchHit[]> {
    const filters = [
      categoria ? `categorias = "${categoria}"` : undefined,
      regiao ? `regioes = "${regiao}"` : undefined,
    ].filter((f): f is string => Boolean(f));

    return this.safeSearch(() =>
      this.client.index<FornecedorSearchHit>(FORNECEDORES_INDEX).search(q ?? "", {
        filter: filters.length ? filters : undefined,
        limit,
      }),
    );
  }

  async searchProdutos(
    q: string | undefined,
    categoria: string | undefined,
    fornecedorId: string | undefined,
    limit: number,
  ): Promise<ProdutoSearchHit[]> {
    const filters = [
      categoria ? `categoria = "${categoria}"` : undefined,
      fornecedorId ? `fornecedorId = "${fornecedorId}"` : undefined,
    ].filter((f): f is string => Boolean(f));

    return this.safeSearch(() =>
      this.client.index<ProdutoSearchHit>(PRODUTOS_INDEX).search(q ?? "", {
        filter: filters.length ? filters : undefined,
        limit,
      }),
    );
  }

  private async safeCall(op: () => Promise<unknown>): Promise<void> {
    try {
      await op();
    } catch (err) {
      this.logger.warn(`Falha ao indexar no Meilisearch (best-effort, ignorada): ${(err as Error).message}`);
    }
  }

  private async safeSearch<T>(op: () => Promise<{ hits: T[] }>): Promise<T[]> {
    try {
      const { hits } = await op();
      return hits;
    } catch (err) {
      this.logger.warn(`Falha ao buscar no Meilisearch: ${(err as Error).message}`);
      return [];
    }
  }
}
