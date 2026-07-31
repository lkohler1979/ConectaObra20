/**
 * Chunking por parágrafo (E5-01) — agrupa parágrafos consecutivos até o
 * limite de caracteres; um parágrafo sozinho maior que o limite vira seu
 * próprio chunk (não corta no meio de frase à força).
 */
export function chunkText(text: string, maxChars = 1200): string[] {
  const paragrafos = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let atual = "";

  for (const paragrafo of paragrafos) {
    const candidato = atual ? `${atual}\n\n${paragrafo}` : paragrafo;
    if (candidato.length > maxChars && atual) {
      chunks.push(atual);
      atual = paragrafo;
    } else {
      atual = candidato;
    }
  }
  if (atual) {
    chunks.push(atual);
  }

  if (chunks.length > 0) {
    return chunks;
  }

  const textoLimpo = text.trim();
  return textoLimpo.length > 0 ? [textoLimpo] : [];
}
