import "dotenv/config";
import { baseEnvSchema, parseEnv } from "@conectaobra/config/env";

export const envSchema = baseEnvSchema;

export const env = parseEnv(envSchema);
