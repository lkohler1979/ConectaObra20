import { Injectable } from "@nestjs/common";
import type { MaterialListItem } from "@conectaobra/types/material-lists";
import { CalculatorsService } from "./calculators.service";

const PERCENTUAL_PERDA_PADRAO = 0.1;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Gerador de lista de materiais (E5-07) — SIMULADO: regras por
 * palavra-chave sobre a descrição da obra, não um LLM real (decisão
 * confirmada com o usuário, mesmo espírito do resto da IA simulada nesta
 * sessão). Quando existe calculadora determinística (E5-04) pra uma
 * categoria e a área foi informada, usa o cálculo preciso; categorias sem
 * fórmula (elétrica/hidráulica) viram item qualitativo com observação
 * pedindo revisão manual — nunca fabrica uma quantidade que exigiria
 * projeto executivo real (CLAUDE.md §5 regra 3).
 */
@Injectable()
export class MaterialGeneratorService {
  constructor(private readonly calculators: CalculatorsService) {}

  gerar(descricao: string, areaM2?: number): MaterialListItem[] {
    const texto = descricao.toLowerCase();
    const itens: MaterialListItem[] = [];

    if (/pintura|pintar/.test(texto) && areaM2) {
      const { litrosNecessarios } = this.calculators.tinta({
        areaM2,
        numeroDemaos: 2,
        rendimentoM2PorLitro: 6,
      });
      itens.push({
        descricao: "Tinta látex (2 demãos)",
        quantidade: litrosNecessarios,
        unidade: "litro",
        categoria: "tinta",
        observacao:
          "Calculado com rendimento padrão de 6 m²/litro — confira o rendimento real na embalagem do produto escolhido.",
      });
    }

    if (/piso|revestimento|porcelanato|ceramica|cerâmica/.test(texto) && areaM2) {
      itens.push({
        descricao: "Piso/revestimento",
        quantidade: round2(areaM2 * (1 + PERCENTUAL_PERDA_PADRAO)),
        unidade: "m2",
        categoria: "revestimento",
        observacao:
          "Área com 10% de perda pra corte — regra geral de obra, ajuste conforme o padrão de assentamento.",
      });
      itens.push({
        descricao: "Argamassa colante",
        quantidade: round2(areaM2 * 5),
        unidade: "kg",
        categoria: "revestimento",
        observacao: "Estimativa de ~5kg/m² — varia conforme o tipo de piso e a superfície.",
      });
    }

    if (/alvenaria|bloco|tijolo/.test(texto) && areaM2) {
      const { quantidadeBlocos } = this.calculators.blocos({
        areaParedeM2: areaM2,
        blocoComprimentoCm: 39,
        blocoAlturaCm: 19,
        espessuraJuntaCm: 1,
        percentualPerda: PERCENTUAL_PERDA_PADRAO,
      });
      itens.push({
        descricao: "Bloco de concreto 9x19x39",
        quantidade: quantidadeBlocos,
        unidade: "unidade",
        categoria: "estrutural",
        observacao:
          "Calculado pra bloco padrão 9x19x39 com junta de 1cm — ajuste se o bloco real for outro.",
      });

      const { volumeArgamassaM3 } = this.calculators.argamassa({
        areaParedeM2: areaM2,
        blocoComprimentoCm: 39,
        blocoAlturaCm: 19,
        blocoLarguraCm: 14,
        espessuraJuntaCm: 1,
        percentualPerda: PERCENTUAL_PERDA_PADRAO,
      });
      itens.push({
        descricao: "Argamassa de assentamento",
        quantidade: volumeArgamassaM3,
        unidade: "m3",
        categoria: "estrutural",
      });
    }

    if (/eletrica|elétrica|fiacao|fiação|tomada|disjuntor/.test(texto)) {
      itens.push({
        descricao: "Material elétrico (fios, disjuntores, tomadas)",
        quantidade: 1,
        unidade: "verba",
        categoria: "eletrica",
        observacao:
          "Quantidade a definir conforme projeto elétrico — sem fórmula determinística pra esse item ainda.",
      });
    }

    if (/hidraulica|hidráulica|encanamento|tubulacao|tubulação/.test(texto)) {
      itens.push({
        descricao: "Material hidráulico (tubos, conexões, registros)",
        quantidade: 1,
        unidade: "verba",
        categoria: "hidraulica",
        observacao:
          "Quantidade a definir conforme projeto hidráulico — sem fórmula determinística pra esse item ainda.",
      });
    }

    return itens;
  }
}
