import { Injectable } from "@nestjs/common";
import type { ConsentType } from "@conectaobra/types/legal";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { CURRENT_LEGAL_VERSION } from "./legal-versions";

/**
 * Append-only (E1-08) — cada aceite/revogação é uma linha nova em `consents`,
 * nunca um UPDATE. O estado atual de um (userId, tipo) é a linha mais
 * recente. Isso é o que prova o histórico de consentimento exigido pela
 * LGPD, não um botão liga/desliga sem rastro.
 */
@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async record(userId: string, tipo: ConsentType, aceito: boolean): Promise<void> {
    await this.prisma.consent.create({
      data: { userId, tipo, aceito, versao: CURRENT_LEGAL_VERSION },
    });
    await this.auditLog.record({
      userId,
      acao: "consent.recorded",
      entidade: "consent",
      payload: { tipo, aceito, versao: CURRENT_LEGAL_VERSION },
    });
  }

  /** Chamado por AuthService.register() — sem os dois, não há cadastro. */
  async recordMandatoryOnRegister(userId: string): Promise<void> {
    await this.record(userId, "TERMOS_USO", true);
    await this.record(userId, "POLITICA_PRIVACIDADE", true);
  }
}
