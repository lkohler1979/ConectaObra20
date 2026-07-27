import type { Params } from "nestjs-pino";
import { env } from "../../config/env";

/**
 * Logger estruturado (pino) — CLAUDE.md §5 regra 4: nunca logar CPF/token em
 * texto claro. `redact` cobre os campos sensíveis mais prováveis de aparecer
 * em req/res (headers de auth, corpo com CPF/CNPJ/senha/token).
 */
export const loggerConfig: Params = {
  pinoHttp: {
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.senha",
        "req.body.password",
        "req.body.cpf",
        "req.body.cpfCnpj",
        "req.body.token",
        "res.headers['set-cookie']",
      ],
      censor: "[REDACTED]",
    },
    transport:
      env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { singleLine: true } }
        : undefined,
  },
};
