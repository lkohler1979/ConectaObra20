import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";

export interface RfqMatchNotificationJob {
  rfqId: string;
  prestadorId: string;
}

export const NOTIFICATIONS_QUEUE = "notifications";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<RfqMatchNotificationJob>,
  ) {}

  async enqueueRfqMatch(job: RfqMatchNotificationJob): Promise<void> {
    await this.queue.add("rfq-match", job);
  }
}
