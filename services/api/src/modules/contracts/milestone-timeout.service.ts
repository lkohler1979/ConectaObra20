import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { env } from "../../config/env";

export interface MilestoneTimeoutJob {
  contractId: string;
  milestoneId: string;
}

export const MILESTONE_TIMEOUT_QUEUE = "milestone-timeout";

const DIA_EM_MS = 24 * 60 * 60 * 1000;

/**
 * Aprovação automática (E4-08) — agenda avisos em D-3/D-1 e a aprovação
 * automática em D-0 (`MILESTONE_AUTO_APROVACAO_DIAS`, confirmado com o
 * usuário: 7 dias por padrão). Cada job relê o status atual da etapa antes
 * de agir — se ela já saiu de `ENTREGUE` (aprovada manualmente, disputada),
 * o job é um no-op, então não precisa cancelar jobs pendentes explicitamente.
 */
@Injectable()
export class MilestoneTimeoutService {
  constructor(
    @InjectQueue(MILESTONE_TIMEOUT_QUEUE)
    private readonly queue: Queue<MilestoneTimeoutJob>,
  ) {}

  async scheduleTimeout(contractId: string, milestoneId: string): Promise<void> {
    const dias = env.MILESTONE_AUTO_APROVACAO_DIAS;
    const data: MilestoneTimeoutJob = { contractId, milestoneId };

    if (dias > 3) {
      await this.queue.add("aviso-d3", data, { delay: (dias - 3) * DIA_EM_MS });
    }
    if (dias > 1) {
      await this.queue.add("aviso-d1", data, { delay: (dias - 1) * DIA_EM_MS });
    }
    await this.queue.add("auto-aprovar", data, { delay: dias * DIA_EM_MS });
  }
}
