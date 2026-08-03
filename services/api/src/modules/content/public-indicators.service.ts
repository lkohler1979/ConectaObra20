import { Injectable } from "@nestjs/common";
import type { IndicatorPublic, ListPublicIndicatorsQuery } from "@conectaobra/types/indicators";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toPublicIndicator } from "./indicator-public.mapper";

/** Listagem pública (sem login) de indicadores de mercado (E9-02). */
@Injectable()
export class PublicIndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPublicIndicatorsQuery): Promise<IndicatorPublic[]> {
    const indicators = await this.prisma.indicator.findMany({
      where: {
        ...(query.tipo ? { tipo: query.tipo } : {}),
        ...(query.regiao ? { regiao: query.regiao } : {}),
      },
      orderBy: { referenciaMes: "desc" },
      take: query.limit,
    });

    return indicators.map(toPublicIndicator);
  }
}
