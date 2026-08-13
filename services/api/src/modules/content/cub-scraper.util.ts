import { load } from "cheerio";

export interface CubValores {
  cubCentavos: number;
  desoneradoCentavos: number;
}

/** "R$ 2.800,10" → 280010 (centavos). */
function parseReaisParaCentavos(texto: string): number | null {
  const limpo = texto.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
  const valor = Number(limpo);
  if (!Number.isFinite(valor)) return null;
  return Math.round(valor * 100);
}

/**
 * Parser da resposta de `cub_valor.asp` (Sinduscon-ES) — HTML legado, sem
 * API estruturada. A tabela de valores é a única do documento usando as
 * classes `tabela_cabec`/`tabela_linha` (confirmado lendo o HTML de origem
 * e testando contra o site real nesta sessão): a linha de dados tem 4
 * células `.tabela_cabec[align="right"]`, na ordem [CUB valor, CUB
 * variação, desonerado valor, desonerado variação] — só os dois valores
 * (índices 0 e 2) são usados aqui; variação é derivável depois comparando
 * meses consecutivos já guardados, não precisa ser persistida.
 *
 * Retorna `null` (nunca lança) se a estrutura não bater — sinal de que o
 * HTML upstream mudou; quem chama trata isso como falha best-effort de um
 * mês específico, sem derrubar a sincronização dos demais.
 */
export function parseCubValorHtml(html: string): CubValores | null {
  const $ = load(html);
  const valores = $('.tabela_cabec[align="right"]');

  if (valores.length < 3) {
    return null;
  }

  const cubCentavos = parseReaisParaCentavos($(valores[0]).text());
  const desoneradoCentavos = parseReaisParaCentavos($(valores[2]).text());

  if (cubCentavos === null || desoneradoCentavos === null) {
    return null;
  }

  return { cubCentavos, desoneradoCentavos };
}
