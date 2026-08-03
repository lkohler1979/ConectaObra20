import { Injectable } from "@nestjs/common";
import type { IndicatorPublic, UpsertIndicatorInput } from "@conectaobra/types/indicators";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicIndicator } from "./indicator-public.mapper";

/**
 * Indicadores de mercado (E9-02) — cadastro manual do ADMIN, mesmo padrão
 * de `BudgetAnalyzerService.upsertAvgCost` (E5-05): sem fonte externa
 * integrada, upsert por (tipo, regiao, referenciaMes).
 */
@Injectable()
export class IndicatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async upsert(adminId: string, input: UpsertIndicatorInput): Promise<IndicatorPublic> {
    const indicator = await this.prisma.indicator.upsert({
      where: {
        tipo_regiao_referenciaMes: {
          tipo: input.tipo,
          regiao: input.regiao,
          referenciaMes: input.referenciaMes,
        },
      },
      update: {
        valorCentavos: input.valorCentavos,
        fonte: input.fonte,
      },
      create: {
        tipo: input.tipo,
        regiao: input.regiao,
        valorCentavos: input.valorCentavos,
        referenciaMes: input.referenciaMes,
        fonte: input.fonte,
      },
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "indicator.upserted",
      entidade: "indicator",
      payload: { indicatorId: indicator.id, tipo: indicator.tipo, regiao: indicator.regiao },
    });

    return toPublicIndicator(indicator);
  }
}
