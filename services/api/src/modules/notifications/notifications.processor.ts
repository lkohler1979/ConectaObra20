import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { NOTIFICATIONS_QUEUE, type RfqMatchNotificationJob } from "./notifications.service";

/**
 * Stub — nenhum provedor de push/e-mail/WhatsApp foi escolhido ainda (E3-04,
 * ver PENDENCIAS.md). Loga em vez de enviar, mesmo padrão do OtpNotifier
 * (E1-01): a fila/worker existem de verdade, só falta plugar o canal real.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<RfqMatchNotificationJob>): Promise<void> {
    this.logger.warn(
      `[DEV-ONLY] Notificaria prestador ${job.data.prestadorId} sobre o RFQ ${job.data.rfqId} — nenhum provedor de push/e-mail/WhatsApp configurado`,
    );
  }
}
