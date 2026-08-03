import * as XLSX from "xlsx";
import type { ImportProductRowError } from "@conectaobra/types/catalog";

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** "Código", "  Unidade de Medida " etc. -> "codigo", "unidade de medida". */
function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .trim()
    .toLowerCase();
}

const HEADER_ALIASES: Record<string, string[]> = {
  codigo: ["codigo", "cod", "sku"],
  descricao: ["descricao", "descricao do produto", "produto", "nome"],
  unidade: ["unidade", "unidade de medida", "un", "und"],
  valor: ["valor", "preco", "preco unitario", "valor unitario"],
};

function findColumn(headers: string[], field: keyof typeof HEADER_ALIASES): string | undefined {
  const aliases = HEADER_ALIASES[field];
  return headers.find((header) => aliases.includes(normalizeHeader(header)));
}

/**
 * Converte um valor de célula "valor" (número ou texto em R$/vírgula
 * decimal pt-BR) pra centavos (CLAUDE.md §5 regra 1: dinheiro é integer).
 * Retorna null se não for um valor monetário positivo válido.
 */
export function parseValorParaCentavos(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw * 100) : null;
  }
  if (typeof raw !== "string") return null;

  let cleaned = raw.trim().replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    // pt-BR: "." é separador de milhar, "," é decimal -> "1.234,56"
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
}

export interface ParsedProductRow {
  linha: number;
  codigo: string;
  descricao: string;
  unidade: string;
  precoCentavos: number;
}

export interface ParsedProductsSpreadsheet {
  rows: ParsedProductRow[];
  erros: ImportProductRowError[];
}

/**
 * Lê a primeira aba de uma planilha (xlsx/xls) e extrai produtos a partir
 * das colunas código/descrição/unidade/valor (tolerante a acento e
 * maiúsculas, aceita alguns sinônimos comuns — ver HEADER_ALIASES).
 */
export function parseProductsSpreadsheet(buffer: Buffer): ParsedProductsSpreadsheet {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const erros: ImportProductRowError[] = [];

  if (!sheetName) {
    return { rows: [], erros: [{ linha: 0, motivo: "Planilha vazia — nenhuma aba encontrada" }] };
  }

  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  if (records.length === 0) {
    return { rows: [], erros: [{ linha: 0, motivo: "Planilha sem linhas de dados" }] };
  }

  const headers = Object.keys(records[0]);
  const codigoCol = findColumn(headers, "codigo");
  const descricaoCol = findColumn(headers, "descricao");
  const unidadeCol = findColumn(headers, "unidade");
  const valorCol = findColumn(headers, "valor");

  if (!codigoCol || !descricaoCol || !unidadeCol || !valorCol) {
    const faltando = [
      !codigoCol && "código",
      !descricaoCol && "descrição",
      !unidadeCol && "unidade",
      !valorCol && "valor",
    ].filter(Boolean);
    return {
      rows: [],
      erros: [
        {
          linha: 1,
          motivo: `Colunas obrigatórias não encontradas no cabeçalho: ${faltando.join(", ")}`,
        },
      ],
    };
  }

  const rows: ParsedProductRow[] = [];
  const codigosNoArquivo = new Set<string>();

  records.forEach((record, index) => {
    // linha 1 é o cabeçalho — a primeira linha de dados é a 2.
    const linha = index + 2;

    const codigo = String(record[codigoCol] ?? "").trim();
    const descricao = String(record[descricaoCol] ?? "").trim();
    const unidade = String(record[unidadeCol] ?? "").trim();
    const precoCentavos = parseValorParaCentavos(record[valorCol]);

    if (!codigo) {
      erros.push({ linha, motivo: "Código em branco" });
      return;
    }
    if (codigosNoArquivo.has(codigo)) {
      erros.push({ linha, motivo: `Código "${codigo}" duplicado na planilha` });
      return;
    }
    if (!descricao) {
      erros.push({ linha, motivo: "Descrição em branco" });
      return;
    }
    if (!unidade) {
      erros.push({ linha, motivo: "Unidade em branco" });
      return;
    }
    if (precoCentavos === null) {
      erros.push({ linha, motivo: `Valor inválido: "${String(record[valorCol])}"` });
      return;
    }

    codigosNoArquivo.add(codigo);
    rows.push({ linha, codigo, descricao, unidade, precoCentavos });
  });

  return { rows, erros };
}
