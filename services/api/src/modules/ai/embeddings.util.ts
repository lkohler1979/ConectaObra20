import { createHash } from "node:crypto";

/** Dimensão do vetor simulado — arbitrária, sem ligação com nenhum provedor real. */
export const EMBEDDING_DIM = 256;

/** Marcas de acentuação Unicode (bloco Combining Diacritical Marks) após normalização NFD. */
const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Embedding SIMULADO (feature hashing determinístico) — sem custo, sem API
 * externa, sem qualidade semântica real (só captura sobreposição exata de
 * palavras entre os textos). Serve pra montar o pipeline RAG (ingestão →
 * storage → retrieval) de ponta a ponta; trocar por um provedor real
 * (OpenAI/Voyage/Cohere) exige só reescrever esta função — o resto do
 * pipeline não muda. Decisão de simular confirmada com o usuário (E5-01).
 */
export function embedText(text: string, dim: number = EMBEDDING_DIM): number[] {
  const vector = new Array(dim).fill(0);
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .match(/[a-z0-9]+/g);

  if (!tokens) {
    return vector;
  }

  for (const token of tokens) {
    const hash = createHash("sha256").update(token).digest();
    const index = hash.readUInt32BE(0) % dim;
    const sinal = hash[4] % 2 === 0 ? 1 : -1;
    vector[index] += sinal;
  }

  const norma = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norma);
}

/** Formata um vetor pro literal `vector` do pgvector em SQL: "[0.1,0.2,...]". */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
