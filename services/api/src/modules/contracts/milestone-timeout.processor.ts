import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MilestonesService } from "./milestones.service";
import { MILESTONE_TIMEOUT_QUEUE, type MilestoneTimeoutJob } from "./milestone-timeout.service";

/**
 * Avisos (D-3/D-1) só logam — mesmo stub best-effort de `NotificationsProcessor`
 * (nenhum provedor de push/e-mail/WhatsApp escolhido, E3-04). A auto-aprovação
 * de fato chama `MilestonesService.aprovarAutomaticamente()`, que relê o
 * estado atual da etapa antes de agir (self-cancelling).
 */
@Processor(MILESTONE_TIMEOUT_QUEUE)
export class MilestoneTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(MilestoneTimeoutProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly milestonesService: MilestonesService,
  ) {
    super();
  }

  async process(job: Job<MilestoneTimeoutJob>): Promise<void> {
    const { contractId, milestoneId } = job.data;

    if (job.name === "auto-aprovar") {
      await this.milestonesService.aprovarAutomaticamente(contractId, milestoneId);
      return;
    }

    const milestone = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.status !== "ENTREGUE") {
      return;
    }

    const diasRestantes = job.name === "aviso-d3" ? 3 : 1;
    this.logger.warn(
      `[DEV-ONLY] Avisaria o cliente do contrato ${contractId}: etapa ${milestoneId} será aprovada automaticamente em ${diasRestantes} dia(s) — nenhum provedor de push/e-mail configurado`,
    );
  }
}
