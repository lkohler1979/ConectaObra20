import * as XLSX from "xlsx";
import type { SinapiItem } from "@conectaobra/types/sinapi";

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** Mesmo padrão de `catalog/xlsx-import.util.ts` — usado tanto no parse quanto na busca (comparação em ambos os lados). */
export function normalizarTermo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .trim()
    .toLowerCase();
}

/**
 * Layout confirmado lendo o arquivo real da CAIXA nesta sessão (referência
 * 07/2026) — colunas fixas nas abas ISD/ICD (insumos) e CSD/CCD
 * (composições): 27 UFs em ordem alfabética a partir da coluna 5 (insumos,
 * 1 coluna cada) ou 4 (composições, 2 colunas cada — Custo + %AS). ES é a
 * 8ª UF nessa ordem (AC AL AM AP BA CE DF **ES** GO ...).
 */
const LINHA_CABECALHO_INSUMOS = 9;
const LINHA_PRIMEIRO_DADO_INSUMOS = 10;
const COL_ES_INSUMOS = 12;

const LINHA_CABECALHO_COMPOSICOES = 9;
const LINHA_PRIMEIRO_DADO_COMPOSICOES = 10;
const COL_ES_CUSTO_COMPOSICOES = 18;

const LINHA_MES_REFERENCIA = 2;

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
}

function paraCentavos(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return Math.round(valor * 100);
}

/** "07/2026" — lida direto da célula "Mês de Referência" de qualquer aba do arquivo (ISD usada por convenção). */
export function parseReferenciaMes(wb: XLSX.WorkBook): string | null {
  const sheet = wb.Sheets["ISD"];
  if (!sheet) return null;
  const rows = sheetToRows(sheet);
  const linha = rows[LINHA_MES_REFERENCIA];
  if (!linha || typeof linha[1] !== "string") return null;
  return linha[1];
}

/** Junta ISD (sem desoneração) + ICD (com desoneração) por código — mesma ordem de linhas nas duas abas. */
export function parseInsumos(wb: XLSX.WorkBook): SinapiItem[] {
  const isd = wb.Sheets["ISD"];
  const icd = wb.Sheets["ICD"];
  if (!isd || !icd) return [];

  const linhasSem = sheetToRows(isd);
  const linhasCom = sheetToRows(icd);

  const cabecalho = linhasSem[LINHA_CABECALHO_INSUMOS];
  if (!cabecalho || !String(cabecalho[2] ?? "").toLowerCase().includes("descri")) {
    return [];
  }

  const itens: SinapiItem[] = [];
  for (let i = LINHA_PRIMEIRO_DADO_INSUMOS; i < linhasSem.length; i++) {
    const linha = linhasSem[i];
    if (!linha || linha[1] === "" || linha[1] === undefined) continue;

    const codigo = Number(linha[1]);
    if (!Number.isFinite(codigo)) continue;

    itens.push({
      tipo: "insumo",
      codigo,
      descricao: String(linha[2] ?? ""),
      unidade: String(linha[3] ?? ""),
      categoria: String(linha[0] ?? ""),
      precoSemDesoneracaoCentavos: paraCentavos(linha[COL_ES_INSUMOS]),
      precoComDesoneracaoCentavos: paraCentavos(linhasCom[i]?.[COL_ES_INSUMOS]),
    });
  }
  return itens;
}

/**
 * Junta CSD (sem desoneração) + CCD (com desoneração) por posição — mesma
 * ordem de linhas nas duas abas. Achado confirmado lendo o arquivo real
 * (referência 07/2026): a coluna "Código da Composição" vem **zerada em
 * 100% das linhas** neste relatório consolidado — não é bug do parser,
 * é assim no arquivo de origem (o código real de composição parece só
 * existir nos relatórios legados por UF/nas abas Analítico). `codigo`
 * fica no schema por consistência, mas o frontend não deve tratá-lo como
 * identificador confiável pra composições — só pra insumos (ISD/ICD têm
 * códigos reais e variados).
 */
export function parseComposicoes(wb: XLSX.WorkBook): SinapiItem[] {
  const csd = wb.Sheets["CSD"];
  const ccd = wb.Sheets["CCD"];
  if (!csd || !ccd) return [];

  const linhasSem = sheetToRows(csd);
  const linhasCom = sheetToRows(ccd);

  const cabecalho = linhasSem[LINHA_CABECALHO_COMPOSICOES];
  if (!cabecalho || !String(cabecalho[2] ?? "").toLowerCase().includes("descri")) {
    return [];
  }

  const itens: SinapiItem[] = [];
  for (let i = LINHA_PRIMEIRO_DADO_COMPOSICOES; i < linhasSem.length; i++) {
    const linha = linhasSem[i];
    if (!linha || linha[1] === "" || linha[1] === undefined) continue;

    const codigo = Number(linha[1]);
    if (!Number.isFinite(codigo)) continue;

    itens.push({
      tipo: "composicao",
      codigo,
      descricao: String(linha[2] ?? ""),
      unidade: String(linha[3] ?? ""),
      categoria: String(linha[0] ?? ""),
      precoSemDesoneracaoCentavos: paraCentavos(linha[COL_ES_CUSTO_COMPOSICOES]),
      precoComDesoneracaoCentavos: paraCentavos(linhasCom[i]?.[COL_ES_CUSTO_COMPOSICOES]),
    });
  }
  return itens;
}
