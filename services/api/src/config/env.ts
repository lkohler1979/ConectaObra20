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
});

export const env = parseEnv(envSchema);
