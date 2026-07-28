import { Injectable } from "@nestjs/common";
import type {
  ArgamassaInput,
  ArgamassaOutput,
  BlocosInput,
  BlocosOutput,
  ConcretoInput,
  ConcretoOutput,
  TintaInput,
  TintaOutput,
} from "@conectaobra/types/ai-calc";

const DISCLAIMER_ESTRUTURAL =
  "Estimativa aproximada baseada em parâmetros de referência — não substitui dimensionamento por " +
  "profissional habilitado (engenheiro/arquiteto com ART/RRT). Para uso estrutural, valide com um " +
  "responsável técnico antes de comprar material ou iniciar a execução.";

const DISCLAIMER_ACABAMENTO =
  "Estimativa aproximada — o rendimento real varia conforme o produto, a superfície e a técnica de " +
  "aplicação. Confira sempre o rendimento informado na embalagem do produto usado.";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class CalculatorsService {
  /**
   * Traço de concreto em volume (cimento = 1 parte). Método simplificado de
   * "partes" amplamente usado em calculadoras de traço — não corrige por
   * densidade real dos agregados, é uma estimativa de obra pequena/média,
   * não um traço de dosagem racional de laboratório.
   *
   * fatorConversao (~1.53): quantidade de material seco solto necessária
   * pra produzir 1m³ de concreto compactado, já que os grãos maiores
   * (brita/areia) se acomodam preenchendo vazios com a pasta de cimento —
   * valor de referência comumente citado em guias de construção civil.
   */
  concreto(input: ConcretoInput): ConcretoOutput {
    const FATOR_CONVERSAO = 1.53;
    const DENSIDADE_CIMENTO_KG_M3 = 1400;
    const FATOR_AGUA_CIMENTO = 0.55;

    const volumeSecoTotalM3 = input.volumeM3 * FATOR_CONVERSAO;
    const totalPartes = 1 + input.partesAreia + input.partesBrita;
    const cimentoM3 = volumeSecoTotalM3 / totalPartes;
    const areiaM3 = cimentoM3 * input.partesAreia;
    const britaM3 = cimentoM3 * input.partesBrita;
    const cimentoKg = cimentoM3 * DENSIDADE_CIMENTO_KG_M3;

    return {
      sacosCimento50kg: Math.ceil(cimentoKg / 50),
      areiaM3: round2(areiaM3),
      britaM3: round2(britaM3),
      aguaLitros: round2(cimentoKg * FATOR_AGUA_CIMENTO),
      disclaimer: DISCLAIMER_ESTRUTURAL,
    };
  }

  /** Blocos por m² a partir da área de face do bloco somada à junta em duas direções. */
  private blocosPorM2(comprimentoCm: number, alturaCm: number, juntaCm: number): number {
    const areaComJuntaM2 = ((comprimentoCm + juntaCm) / 100) * ((alturaCm + juntaCm) / 100);
    return 1 / areaComJuntaM2;
  }

  blocos(input: BlocosInput): BlocosOutput {
    const porM2 = this.blocosPorM2(
      input.blocoComprimentoCm,
      input.blocoAlturaCm,
      input.espessuraJuntaCm,
    );

    return {
      blocosPorM2: round2(porM2),
      quantidadeBlocos: Math.ceil(input.areaParedeM2 * porM2 * (1 + input.percentualPerda)),
      disclaimer: DISCLAIMER_ESTRUTURAL,
    };
  }

  /**
   * Volume de argamassa de assentamento = volume ocupado pelo bloco já
   * assentado (com junta nas duas direções — comprimento e altura, sem
   * junta na profundidade, já que blocos costumam ser assentados encostados
   * nessa direção) menos o volume do bloco em si, multiplicado pela
   * quantidade de blocos. É geometria direta, não um coeficiente fixo.
   */
  argamassa(input: ArgamassaInput): ArgamassaOutput {
    const { blocoComprimentoCm: C, blocoAlturaCm: H, blocoLarguraCm: L, espessuraJuntaCm: J } =
      input;

    const volumeBlocoM3 = (C / 100) * (H / 100) * (L / 100);
    const volumeAssentadoM3 = ((C + J) / 100) * ((H + J) / 100) * (L / 100);
    const volumeArgamassaPorBlocoM3 = volumeAssentadoM3 - volumeBlocoM3;

    const porM2 = this.blocosPorM2(C, H, J);
    const quantidadeBlocos = input.areaParedeM2 * porM2 * (1 + input.percentualPerda);

    return {
      volumeArgamassaM3: round2(quantidadeBlocos * volumeArgamassaPorBlocoM3),
      disclaimer: DISCLAIMER_ESTRUTURAL,
    };
  }

  tinta(input: TintaInput): TintaOutput {
    const litros = (input.areaM2 * input.numeroDemaos) / input.rendimentoM2PorLitro;

    return {
      litrosNecessarios: round2(litros),
      disclaimer: DISCLAIMER_ACABAMENTO,
    };
  }
}
