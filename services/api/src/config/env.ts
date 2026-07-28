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
});

export const env = parseEnv(envSchema);
