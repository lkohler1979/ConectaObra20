import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { assertSafeExternalUrl } from "../../common/security/url-safety";
import { parseCubValorHtml } from "./cub-scraper.util";

export const CUB_SYNC_QUEUE = "cub-sync";

const SINDUSCON_CUB_URL = "https://www.sinduscon-es.com.br/v2/cgi-bin/cub_valor.asp?menu2=25";
const REGIAO = "ES";
const FONTE = "Sinduscon-ES";
/** Cortesia com o site de terceiro — sem paralelismo nas 12 chamadas sequenciais. */
const DELAY_ENTRE_CHAMADAS_MS = 500;

/**
 * Ingestão automática do CUB-ES (a pedido do usuário) — reverte, só pra este
 * caso, a decisão anterior de "sem ingestão automática de indicador"
 * (`PENDENCIAS.md` P-066). Roda diariamente (job repetível registrado em
 * `onModuleInit`) e sincroniza os últimos 12 meses inteiros, não só o mês
 * atual — se algum valor for corrigido pelo Sinduscon depois de publicado,
 * o dado guardado se autocorrige no dia seguinte, e cobre o caso de um dia
 * ter falhado.
 *
 * Scraping de site legado é inerentemente frágil a mudança de HTML upstream
 * — falha de 1 mês nunca derruba os outros (best-effort, mesmo espírito de
 * `RfqService.create`/`PurchaseQuotesService.requestQuotes`).
 */
@Injectable()
export class CubSyncService implements OnModuleInit {
  private readonly logger = new Logger(CubSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @InjectQueue(CUB_SYNC_QUEUE) private readonly queue: Queue,
  ) {}

  /** `jobId` fixo faz o BullMQ deduplicar o agendamento entre restarts da API. */
  async onModuleInit(): Promise<void> {
    await this.queue.add(
      "sync-diario",
      {},
      { repeat: { pattern: "0 6 * * *" }, jobId: "cub-sync-daily" },
    );
  }

  async syncUltimosMeses(quantidade = 12): Promise<void> {
    const referencia = new Date();
    let sincronizados = 0;

    for (let i = 0; i < quantidade; i++) {
      const data = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();

      try {
        const valores = await this.buscarMes(mes, ano);
        if (!valores) {
          this.logger.warn(`CUB ${mes}/${ano}: HTML sem os valores esperados, pulando`);
          continue;
        }

        await this.upsertMes(data, valores);
        sincronizados++;
      } catch (err) {
        this.logger.error(`Falha ao sincronizar CUB ${mes}/${ano}`, err as Error);
      }

      if (i < quantidade - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_ENTRE_CHAMADAS_MS));
      }
    }

    await this.auditLog.record({
      acao: "indicator.cub_synced",
      entidade: "indicator",
      payload: { mesesSincronizados: sincronizados, mesesTentados: quantidade },
    });
  }

  private async buscarMes(mes: number, ano: number) {
    await assertSafeExternalUrl(SINDUSCON_CUB_URL);

    const res = await fetch(SINDUSCON_CUB_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        // UA de navegador real — o site do Sinduscon-ES detecta UAs de
        // bot/desconhecidas e devolve um template mobile sem a tabela de
        // valores (achado nesta sessão, testado contra o site real).
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: `mes=${mes}&ano=${ano}`,
    });
    if (!res.ok) {
      throw new Error(`Sinduscon-ES respondeu ${res.status}`);
    }

    const html = new TextDecoder("iso-8859-1").decode(await res.arrayBuffer());
    return parseCubValorHtml(html);
  }

  private async upsertMes(
    referenciaMes: Date,
    valores: { cubCentavos: number; desoneradoCentavos: number },
  ): Promise<void> {
    await this.prisma.indicator.upsert({
      where: { tipo_regiao_referenciaMes: { tipo: "CUB", regiao: REGIAO, referenciaMes } },
      update: { valorCentavos: valores.cubCentavos, fonte: FONTE },
      create: {
        tipo: "CUB",
        regiao: REGIAO,
        valorCentavos: valores.cubCentavos,
        referenciaMes,
        fonte: FONTE,
      },
    });

    await this.prisma.indicator.upsert({
      where: {
        tipo_regiao_referenciaMes: { tipo: "CUB_DESONERADO", regiao: REGIAO, referenciaMes },
      },
      update: { valorCentavos: valores.desoneradoCentavos, fonte: FONTE },
      create: {
        tipo: "CUB_DESONERADO",
        regiao: REGIAO,
        valorCentavos: valores.desoneradoCentavos,
        referenciaMes,
        fonte: FONTE,
      },
    });
  }
}
