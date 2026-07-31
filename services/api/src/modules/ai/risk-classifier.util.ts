/**
 * Classificador de risco (CLAUDE.md §5 regra 3) — versão simples por
 * palavra-chave. Temas estrutural/elétrico/gás exigem disclaimer +
 * recomendação de profissional habilitado (ART/RRT), regra inegociável do
 * projeto. Um classificador mais robusto (ex.: modelo de intenção) fica
 * pro E5-06 — isto aqui é o mínimo pra não violar a regra enquanto o chat
 * (E5-03) não tinha nenhum guard-rail.
 */
const PALAVRAS_RISCO = [
  "estrutural",
  "estrutura",
  "fundacao",
  "fundação",
  "sapata",
  "viga",
  "pilar",
  "laje",
  "concreto armado",
  "eletrica",
  "elétrica",
  "eletrico",
  "elétrico",
  "fiacao",
  "fiação",
  "disjuntor",
  "quadro de distribuicao",
  "quadro de distribuição",
  "gas",
  "gás",
  "botijao",
  "botijão",
  "vazamento de gas",
  "vazamento de gás",
];

const CATEGORIAS_RISCO = ["estrutural", "eletrica", "elétrica", "gas", "gás"];

const DISCLAIMER =
  "Isto não substitui a avaliação de um profissional habilitado. Consulte um engenheiro, eletricista ou técnico com ART/RRT antes de executar qualquer intervenção estrutural, elétrica ou de gás.";

/** `categorias` vem das fontes recuperadas pelo RAG (E5-01) — chunk pode ter `categoria` nula. */
export function precisaDisclaimer(mensagem: string, categorias: (string | null)[]): boolean {
  const normalizada = mensagem.toLowerCase();
  const temPalavraRisco = PALAVRAS_RISCO.some((palavra) => normalizada.includes(palavra));
  const temCategoriaRisco = categorias.some(
    (categoria) => categoria !== null && CATEGORIAS_RISCO.includes(categoria.toLowerCase()),
  );
  return temPalavraRisco || temCategoriaRisco;
}

export function getDisclaimer(): string {
  return DISCLAIMER;
}
