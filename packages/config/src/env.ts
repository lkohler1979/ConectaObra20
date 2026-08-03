import { z } from "zod";

/**
 * Validação de variáveis de ambiente no boot — CLAUDE.md §5 / 03_Estrutura_Projeto.md
 * ("Variáveis de ambiente: validadas com zod no boot").
 * Cada serviço estende este schema base com o que for específico dele.
 */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3355),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  /// Opcional em desenvolvimento — obrigatório antes de qualquer deploy real (P-011).
  SENTRY_DSN: z.string().url().optional(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Valida `process.env` (ou um objeto equivalente) contra um schema zod.
 * Lança um erro legível no boot em vez de deixar a app subir com config inválida.
 */
export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuração de ambiente inválida:\n${issues}`);
  }
  return result.data;
}
