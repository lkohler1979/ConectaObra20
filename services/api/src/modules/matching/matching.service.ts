import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";

/** Tamanho do lote de rodízio por RFQ — não notifica todo mundo que combina, só os N da vez. */
const MATCH_LIMIT = 10;

interface MatchCandidate {
  user_id: string;
}

/**
 * Motor de matching regional (E3-03): casa um RFQ com prestadores por
 * categoria em comum e, se a obra tiver `geo`, dentro do raio de
 * atendimento do prestador (PostGIS `ST_DWithin`). Sem `geo` na obra, o
 * match cai pra só categoria — não há como filtrar por distância sem
 * coordenadas (ver P-021, geocoding automático ainda não existe).
 *
 * Rodízio: ordena por `ultimoMatchEm` (quem não é casado há mais tempo
 * primeiro) e marca a hora do match pros selecionados — evita que os
 * mesmos prestadores sempre fiquem com todos os leads da categoria.
 */
@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async matchRfq(rfqId: string): Promise<string[]> {
    const rfq = await this.prisma.rfq.findUniqueOrThrow({ where: { id: rfqId } });

    const candidates = await this.prisma.$queryRaw<MatchCandidate[]>`
      WITH obra AS (SELECT geo FROM works WHERE id = ${rfq.obraId}::uuid)
      SELECT pp.user_id
      FROM profiles_prestador pp
      JOIN users u ON u.id = pp.user_id
      WHERE u.deleted_at IS NULL
        AND ${rfq.categoria} = ANY(pp.categorias)
        AND (
          (SELECT geo FROM obra) IS NULL
          OR (
            pp.geo IS NOT NULL
            AND pp.raio_atendimento_km IS NOT NULL
            AND ST_DWithin(pp.geo, (SELECT geo FROM obra), pp.raio_atendimento_km * 1000)
          )
        )
      ORDER BY pp.ultimo_match_em ASC NULLS FIRST
      LIMIT ${MATCH_LIMIT}
    `;

    const prestadorIds = candidates.map((c) => c.user_id);
    if (prestadorIds.length === 0) {
      return [];
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.rfqMatch.createMany({
        data: prestadorIds.map((prestadorId) => ({ rfqId, prestadorId })),
        skipDuplicates: true,
      }),
      this.prisma.profilePrestador.updateMany({
        where: { userId: { in: prestadorIds } },
        data: { ultimoMatchEm: now },
      }),
    ]);

    await this.auditLog.record({
      acao: "rfq.matched",
      entidade: "rfq",
      payload: { rfqId, prestadorIds, quantidade: prestadorIds.length },
    });

    return prestadorIds;
  }
}
