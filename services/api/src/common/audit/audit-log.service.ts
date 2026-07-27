import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { sanitizePayload } from "./sanitize-payload";

export interface AuditLogEntry {
  userId?: string;
  acao: string;
  entidade: string;
  payload: Record<string, unknown>;
  ip?: string;
}

/**
 * audit_log é imutável (CLAUDE.md §5 regra 4, trigger em
 * prisma/migrations/*_init/migration.sql) — este service só expõe `record`,
 * nunca update/delete.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        acao: entry.acao,
        entidade: entry.entidade,
        payload: sanitizePayload(entry.payload) as Prisma.InputJsonValue,
        ip: entry.ip,
      },
    });
  }
}
