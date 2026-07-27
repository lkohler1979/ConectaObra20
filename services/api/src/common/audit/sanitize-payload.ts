/**
 * LGPD (CLAUDE.md §5 regra 4): nunca gravar CPF/token em texto claro no
 * audit_log. Redige recursivamente qualquer chave sensível antes do insert.
 */
const SENSITIVE_KEY_PATTERN =
  /cpf|cnpj|senha|password|token|secret|authorization|cart[aã]o|card/i;

export function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizePayload);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizePayload(val),
      ]),
    );
  }

  return value;
}
