/**
 * Classificador de risco (CLAUDE.md §5 regra 3 / E5-06) — palavra-chave,
 * não um modelo de intenção real. Temas estrutural/elétrico/gás exigem
 * disclaimer + recomendação de profissional habilitado (ART/RRT), regra
 * inegociável do projeto. Lista ampliada nesta rodada (rachadura/trinca,
 * curto-circuito, cheiro de gás etc.) mas falsos negativos continuam
 * possíveis — ver PENDENCIAS.md.
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
  "rachadura",
  "trinca",
  "fissura",
  "recalque",
  "escoramento",
  "demolir",
  "demolição",
  "parede estrutural",
  "eletrica",
  "elétrica",
  "eletrico",
  "elétrico",
  "fiacao",
  "fiação",
  "disjuntor",
  "quadro de distribuicao",
  "quadro de distribuição",
  "curto-circuito",
  "curto circuito",
  "choque eletrico",
  "choque elétrico",
  "fio desencapado",
  "gas",
  "gás",
  "botijao",
  "botijão",
  "vazamento de gas",
  "vazamento de gás",
  "cheiro de gas",
  "cheiro de gás",
  "botijao de gas",
  "botijão de gás",
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
