import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { CUB_SYNC_QUEUE, CubSyncService } from "./cub-sync.service";

/** Job repetível (diário, 6h) — ver `CubSyncService.onModuleInit`. */
@Processor(CUB_SYNC_QUEUE)
export class CubSyncProcessor extends WorkerHost {
  constructor(private readonly cubSyncService: CubSyncService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    await this.cubSyncService.syncUltimosMeses();
  }
}
