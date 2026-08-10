import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { sanitizePayload } from "./sanitize-payload";

export interface AuditLogEntry {
  userId?: string;
  /** Obra relacionada, quando aplicável — alimenta o diário de obra (E6-03). */
  obraId?: string;
  acao: string;
  entidade: string;
  payload: Record<string, unknown>;
  ip?: string;
}

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

/**
 * audit_log é imutável (CLAUDE.md §5 regra 4, trigger em
 * prisma/migrations/*_init/migration.sql) — este service só expõe `record`,
 * nunca update/delete.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `client` opcional permite chamar isto dentro de um `$transaction` (ex:
   * ConsentService.record, chamado de dentro da transação de
   * AuthService.register) — sem isso, o insert usa a conexão fora da
   * transação e não vê a linha (ex: o User) criada mas ainda não commitada,
   * violando a FK (visto em produção: `audit_log_user_id_fkey`).
   */
  async record(entry: AuditLogEntry, client: PrismaClientOrTx = this.prisma): Promise<void> {
    await client.auditLog.create({
      data: {
        userId: entry.userId,
        obraId: entry.obraId,
        acao: entry.acao,
        entidade: entry.entidade,
        payload: sanitizePayload(entry.payload) as Prisma.InputJsonValue,
        ip: entry.ip,
      },
    });
  }
}
