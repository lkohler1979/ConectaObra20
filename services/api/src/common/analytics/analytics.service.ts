import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { PostHog } from "posthog-node";
import { env } from "../../config/env";

/**
 * Analytics de funil (E10-03) — PostHog, fornecedor em aberto (mesma
 * categoria de decisão de S3/SMS/PSP: nenhuma conta real existe ainda).
 * Sem `POSTHOG_API_KEY`, `capture()` só descarta o evento — nunca bloqueia
 * nem derruba o fluxo que o chama (mesmo padrão de `MediaService`/E1-07).
 */
@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly client: PostHog | null;

  constructor() {
    this.client = env.POSTHOG_API_KEY
      ? new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST })
      : null;
  }

  /** Best-effort — nunca lança. Erro de rede/PostHog fora do ar não pode derrubar o fluxo de negócio. */
  capture(distinctId: string, event: string, properties?: Record<string, unknown>): void {
    if (!this.client) return;
    try {
      this.client.capture({ distinctId, event, properties });
    } catch (err) {
      this.logger.warn(
        `Falha ao enviar evento de analytics "${event}": ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
