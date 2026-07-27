import { z } from "zod";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function calcCheckDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce(
    (acc, weight, i) => acc + weight * Number(digits[i]),
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Validação de CPF por dígito verificador (algoritmo oficial da Receita Federal). */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const d1 = calcCheckDigit(cpf, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cpf[9])) return false;

  const d2 = calcCheckDigit(cpf, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cpf[10]);
}

/** Validação de CNPJ por dígito verificador (algoritmo oficial da Receita Federal). */
export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const d1 = calcCheckDigit(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cnpj[12])) return false;

  const d2 = calcCheckDigit(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cnpj[13]);
}

/** Aceita CPF (11 dígitos) ou CNPJ (14 dígitos) — cliente PF/PJ, fornecedor etc. */
export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 11 ? isValidCpf(digits) : isValidCnpj(digits);
}

export const cpfCnpjSchema = z
  .string()
  .transform(onlyDigits)
  .refine(isValidCpfCnpj, { message: "CPF/CNPJ inválido" });

/** E.164 simplificado — CLAUDE.md pede foco no mercado brasileiro, mas não fecha a porta para LatAm. */
export const telefoneSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length >= 10 && v.length <= 15, {
    message: "Telefone inválido",
  })
  .transform((v) => `+${v}`);
