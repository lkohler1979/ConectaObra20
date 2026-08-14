import { Injectable, Logger } from "@nestjs/common";
import AdmZip from "adm-zip";
import * as XLSX from "xlsx";
import type { SinapiItem, SinapiSearchQuery, SinapiSearchResponse } from "@conectaobra/types/sinapi";
import { assertSafeExternalUrl } from "../../common/security/url-safety";
import { normalizarTermo, parseComposicoes, parseInsumos, parseReferenciaMes } from "./sinapi-xlsx.util";

const REGIAO = "ES";
/** Sem persistência por enquanto (a pedido do usuário) — cache em memória, reprocessado quando fica velho. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** A CAIXA publica com atraso — tenta o mês atual e volta até 2 meses se ainda não tiver saído. */
const MESES_TENTATIVAS = 3;

interface Cache {
  referenciaMes: string;
  itens: SinapiItem[];
  carregadoEm: number;
}

/**
 * Busca de SINAPI (insumos/composições, CAIXA) — a pedido do usuário. Lê o
 * ZIP mensal publicado pela CAIXA sob demanda (sem API estruturada
 * disponível — ver ROADMAP R-003 pra uma migração futura pra uma API de
 * terceiro) e mantém só um cache em memória, sem tabela nova no banco.
 */
@Injectable()
export class SinapiCacheService {
  private readonly logger = new Logger(SinapiCacheService.name);
  private cache: Cache | null = null;

  async buscar(query: SinapiSearchQuery): Promise<SinapiSearchResponse> {
    await this.garantirCache();
    if (!this.cache) {
      throw new Error("Não foi possível carregar a base do SINAPI — tente novamente em instantes");
    }

    const termoNormalizado = normalizarTermo(query.termo);
    const palavras = termoNormalizado.split(/\s+/).filter(Boolean);

    const filtrados = this.cache.itens.filter((item) => {
      if (query.tipo !== "todos" && item.tipo !== query.tipo) return false;
      const descricaoNormalizada = normalizarTermo(item.descricao);
      return palavras.every((palavra) => descricaoNormalizada.includes(palavra));
    });

    return {
      regiao: REGIAO,
      referenciaMes: this.cache.referenciaMes,
      total: filtrados.length,
      itens: filtrados.slice(0, query.limit),
    };
  }

  private async garantirCache(): Promise<void> {
    if (this.cache && Date.now() - this.cache.carregadoEm < CACHE_TTL_MS) {
      return;
    }
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    const zipBuffer = await this.baixarZipDoMesMaisRecente();
    const zip = new AdmZip(zipBuffer);

    const entradaReferencia = zip
      .getEntries()
      .find((entry) => {
        const nome = entry.entryName.toLowerCase();
        if (!nome.endsWith(".xlsx")) return false;
        return !nome.includes("manuten") && !nome.includes("familias") && !nome.includes("mao_de_obra");
      });
    if (!entradaReferencia) {
      throw new Error("Arquivo de referência não encontrado no ZIP do SINAPI");
    }

    const wb = XLSX.read(entradaReferencia.getData(), { type: "buffer" });
    const referenciaMes = parseReferenciaMes(wb);
    if (!referenciaMes) {
      throw new Error("Não foi possível ler o mês de referência da planilha do SINAPI");
    }

    const itens = [...parseInsumos(wb), ...parseComposicoes(wb)];
    this.cache = { referenciaMes, itens, carregadoEm: Date.now() };
    this.logger.log(`Base do SINAPI carregada: ${itens.length} itens, referência ${referenciaMes}`);
  }

  private async baixarZipDoMesMaisRecente(): Promise<Buffer> {
    const agora = new Date();

    for (let i = 0; i < MESES_TENTATIVAS; i++) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const url = `https://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-${ano}-${mes}-formato-xlsx.zip`;

      try {
        await assertSafeExternalUrl(url);
        const res = await fetch(url, {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
        });
        if (!res.ok) {
          this.logger.warn(`SINAPI ${mes}/${ano} não disponível (HTTP ${res.status}), tentando mês anterior`);
          continue;
        }
        return Buffer.from(await res.arrayBuffer());
      } catch (err) {
        this.logger.warn(`Falha ao buscar SINAPI ${mes}/${ano}: ${(err as Error).message}`);
      }
    }

    throw new Error("Nenhum arquivo do SINAPI disponível nos últimos meses");
  }
}
