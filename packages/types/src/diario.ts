import { z } from "zod";

/**
 * Diário de obra (E6-03) — feed automático de eventos a partir do
 * `audit_log` já existente (S0-06), filtrado por obra. `payload` fica como
 * `Record<string, unknown>` porque cada `acao` tem um formato próprio
 * (mesmo shape gravado por `AuditLogService.record`, já sanitizado de
 * CPF/token antes do insert).
 */
export const diarioEventoSchema = z.object({
  id: z.string().uuid(),
  acao: z.string(),
  entidade: z.string(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});
export type DiarioEvento = z.infer<typeof diarioEventoSchema>;
