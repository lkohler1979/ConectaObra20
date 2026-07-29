import "dotenv/config";
import { z } from "zod";
import { baseEnvSchema, parseEnv } from "@conectaobra/config/env";

export const envSchema = baseEnvSchema.extend({
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter ao menos 32 caracteres"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15min
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  MFA_CHALLENGE_TTL_SECONDS: z.coerce.number().int().positive().default(300), // 5min
  // Opcionais em dev — sem eles, MediaService responde 503 em vez de derrubar o boot (E1-07).
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /// Só necessário para S3-compatível fora da AWS (MinIO, R2 etc.).
  S3_ENDPOINT: z.string().url().optional(),
  /// Placeholder até E8-01 definir os planos/tiers de verdade (79/149/299/599
  /// etc. — ver docs/prd/04_Tasks_Backlog.md). Hoje: sem Subscription = plano
  /// gratuito = limite mensal de propostas; qualquer Subscription = sem limite.
  FREE_PLAN_MONTHLY_PROPOSAL_LIMIT: z.coerce.number().int().positive().default(5),
  /// Redis já é infra decidida (docker-compose.local.yml, CLAUDE.md §3) —
  /// diferente de S3/SMS (fornecedor em aberto), por isso é obrigatório
  /// como DATABASE_URL, não opcional (E3-04).
  REDIS_URL: z.string().url(),
  /// Meilisearch também é infra decidida (mesmo status do Redis) — mas o
  /// client é preguiçoso (não conecta na hora do `new`), então a ausência
  /// dele no ambiente não derruba o boot, só faz a indexação/busca falhar
  /// de forma best-effort (E2-01).
  MEILI_HOST: z.string().url(),
  MEILI_API_KEY: z.string().min(1),
});

export const env = parseEnv(envSchema);
