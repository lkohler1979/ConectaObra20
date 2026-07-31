import { Injectable } from "@nestjs/common";
import type { AvgCost } from "@prisma/client";
import type {
  AnalisarOrcamentoInput,
  AnaliseOrcamentoOutput,
  AvgCostPublic,
  ClassificacaoOrcamento,
  UpsertAvgCostInput,
} from "@conectaobra/types/ai-budget";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Analisador de orçamento (E5-05) — compara proposta vs. custo médio
 * regional (`AvgCost`, schema desde S0-05, sem endpoints até agora).
 * Classificação puramente determinística por faixa min/max (CLAUDE.md §5
 * regra 3) — nada aqui é o LLM "achando" se o preço é justo. Sem dado
 * curado real ainda (nenhum SINAPI/CUB real foi carregado) — precisa de
 * `upsertAvgCost` manual (ADMIN) até uma fonte real ser integrada.
 */
@Injectable()
export class BudgetAnalyzerService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertAvgCost(input: UpsertAvgCostInput): Promise<AvgCostPublic> {
    const avgCost = await this.prisma.avgCost.upsert({
      where: {
        servico_cidade_mes: { servico: input.servico, cidade: input.cidade, mes: input.mes },
      },
      update: {
        unidade: input.unidade,
        valorMinCentavos: input.valorMinCentavos,
        valorMedCentavos: input.valorMedCentavos,
        valorMaxCentavos: input.valorMaxCentavos,
      },
      create: {
        servico: input.servico,
        cidade: input.cidade,
        unidade: input.unidade,
        valorMinCentavos: input.valorMinCentavos,
        valorMedCentavos: input.valorMedCentavos,
        valorMaxCentavos: input.valorMaxCentavos,
        mes: input.mes,
      },
    });
    return toPublicAvgCost(avgCost);
  }

  async analisar(input: AnalisarOrcamentoInput): Promise<AnaliseOrcamentoOutput> {
    const custoMedio = await this.prisma.avgCost.findFirst({
      where: { servico: input.servico, cidade: input.cidade },
      orderBy: { mes: "desc" },
    });

    if (!custoMedio) {
      return {
        servico: input.servico,
        cidade: input.cidade,
        valorPropostoCentavos: input.valorPropostoCentavos,
        custoMedioRegional: null,
        classificacao: null,
        percentualDesvioDaMedia: null,
        mensagem:
          "Nenhum dado de custo médio regional encontrado pra esse serviço/cidade ainda — não é possível comparar.",
      };
    }

    const percentualDesvioDaMedia =
      Math.round(
        ((input.valorPropostoCentavos - custoMedio.valorMedCentavos) / custoMedio.valorMedCentavos) *
          10_000,
      ) / 100;

    let classificacao: ClassificacaoOrcamento;
    let mensagem: string;
    if (input.valorPropostoCentavos < custoMedio.valorMinCentavos) {
      classificacao = "ABAIXO_DA_MEDIA";
      mensagem =
        "Valor proposto está abaixo até da faixa mínima registrada pra esse serviço na região — vale confirmar se o escopo está completo.";
    } else if (input.valorPropostoCentavos > custoMedio.valorMaxCentavos) {
      classificacao = "ACIMA_DA_MEDIA";
      mensagem = "Valor proposto está acima da faixa máxima registrada pra esse serviço na região.";
    } else {
      classificacao = "DENTRO_DA_MEDIA";
      mensagem = "Valor proposto está dentro da faixa usual registrada pra esse serviço na região.";
    }

    return {
      servico: input.servico,
      cidade: input.cidade,
      valorPropostoCentavos: input.valorPropostoCentavos,
      custoMedioRegional: toPublicAvgCost(custoMedio),
      classificacao,
      percentualDesvioDaMedia,
      mensagem,
    };
  }
}

function toPublicAvgCost(avgCost: AvgCost): AvgCostPublic {
  return {
    id: avgCost.id,
    servico: avgCost.servico,
    cidade: avgCost.cidade,
    unidade: avgCost.unidade,
    valorMinCentavos: avgCost.valorMinCentavos,
    valorMedCentavos: avgCost.valorMedCentavos,
    valorMaxCentavos: avgCost.valorMaxCentavos,
    mes: avgCost.mes.toISOString(),
  };
}
