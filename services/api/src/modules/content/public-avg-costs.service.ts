import { Injectable } from "@nestjs/common";
import type { AvgCostPublic, ListPublicAvgCostsQuery } from "@conectaobra/types/ai-budget";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toPublicAvgCost } from "./avg-cost-public.mapper";

/**
 * Tabela dinâmica de custos médios por cidade (E9-03) — sem login.
 * Reaproveita `AvgCost` (cadastro ADMIN já existe desde E5-05, `POST /ai/avg-costs`).
 */
@Injectable()
export class PublicAvgCostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPublicAvgCostsQuery): Promise<AvgCostPublic[]> {
    const avgCosts = await this.prisma.avgCost.findMany({
      where: {
        ...(query.cidade ? { cidade: query.cidade } : {}),
        ...(query.servico ? { servico: query.servico } : {}),
      },
      orderBy: { mes: "desc" },
      take: query.limit,
    });

    return avgCosts.map(toPublicAvgCost);
  }
}
