import { Injectable } from "@nestjs/common";
import type {
  IngestKnowledgeInput,
  KnowledgeChunkPublic,
  KnowledgeSearchResult,
} from "@conectaobra/types/ai-knowledge";
import { PrismaService } from "../../common/prisma/prisma.service";
import { chunkText } from "./chunking.util";
import { embedText, toVectorLiteral } from "./embeddings.util";

interface KnowledgeChunkRow {
  id: string;
  fonte: string;
  titulo: string;
  conteudo: string;
  categoria: string | null;
  url: string | null;
  created_at: Date;
}

/**
 * Pipeline RAG (E5-01) — ingestão → chunking → embeddings SIMULADOS →
 * retrieval por similaridade de cosseno (pgvector `<=>`). Embeddings não
 * têm qualidade semântica real — ver `embeddings.util.ts` — servem só pra
 * validar o pipeline de ponta a ponta até um provedor real (OpenAI/Voyage/
 * Cohere) ser escolhido (decisão confirmada com o usuário nesta sessão).
 */
@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Exclusivo do ADMIN (controller) — evita conteúdo arbitrário na base curada. */
  async ingest(input: IngestKnowledgeInput): Promise<KnowledgeChunkPublic[]> {
    const chunks = chunkText(input.conteudo);
    const criados: KnowledgeChunkRow[] = [];

    for (const conteudo of chunks) {
      const vetor = toVectorLiteral(embedText(conteudo));
      const linhas = await this.prisma.$queryRaw<KnowledgeChunkRow[]>`
        INSERT INTO knowledge_chunks (fonte, titulo, conteudo, categoria, url, embedding)
        VALUES (${input.fonte}, ${input.titulo}, ${conteudo}, ${input.categoria ?? null}, ${input.url ?? null}, ${vetor}::vector)
        RETURNING id, fonte, titulo, conteudo, categoria, url, created_at
      `;
      criados.push(linhas[0]);
    }

    return criados.map(toPublicChunk);
  }

  async search(query: string, limit: number): Promise<KnowledgeSearchResult[]> {
    const vetor = toVectorLiteral(embedText(query));
    const linhas = await this.prisma.$queryRaw<(KnowledgeChunkRow & { distancia: number })[]>`
      SELECT id, fonte, titulo, conteudo, categoria, url, created_at,
             (embedding <=> ${vetor}::vector) AS distancia
      FROM knowledge_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vetor}::vector
      LIMIT ${limit}
    `;

    return linhas.map((linha) => ({ ...toPublicChunk(linha), distancia: linha.distancia }));
  }
}

function toPublicChunk(row: KnowledgeChunkRow): KnowledgeChunkPublic {
  return {
    id: row.id,
    fonte: row.fonte,
    titulo: row.titulo,
    conteudo: row.conteudo,
    categoria: row.categoria,
    url: row.url,
    createdAt: row.created_at.toISOString(),
  };
}
