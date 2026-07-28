import { z } from "zod";
import { cpfCnpjSchema, telefoneSchema } from "./documents";

/**
 * Tipos de usuário que podem se autocadastrar publicamente.
 * TECNICO e ADMIN são provisionados internamente (E1-02/E5-02), fora do
 * escopo de POST /auth/register.
 */
export const publicUserTypeSchema = z.enum([
  "CLIENTE_PF",
  "CLIENTE_PJ",
  "PRESTADOR",
  "FORNECEDOR",
]);
export type PublicUserType = z.infer<typeof publicUserTypeSchema>;

export const registerInputSchema = z.object({
  tipo: publicUserTypeSchema,
  nome: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email(),
  telefone: telefoneSchema,
  cpfCnpj: cpfCnpjSchema,
  senha: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(72, "Senha muito longa"), // 72 bytes é o limite do bcrypt
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export const otpRequestInputSchema = z.object({
  telefone: telefoneSchema,
});
export type OtpRequestInput = z.infer<typeof otpRequestInputSchema>;

export const otpVerifyInputSchema = z.object({
  telefone: telefoneSchema,
  codigo: z.string().length(6).regex(/^\d{6}$/, "Código deve ter 6 dígitos"),
});
export type OtpVerifyInput = z.infer<typeof otpVerifyInputSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

/**
 * Login com MFA habilitado não devolve tokens direto — devolve um desafio
 * curto (mfaToken) que o client troca em POST /auth/mfa/verify-login junto
 * com o código TOTP (E1-04, CLAUDE.md §5: "MFA obrigatório para operações
 * financeiras" — aqui é o alicerce; a obrigatoriedade por operação vem
 * quando os endpoints financeiros existirem, no épico E4).
 */
export const loginResultSchema = z.discriminatedUnion("mfaRequired", [
  authTokensSchema.extend({ mfaRequired: z.literal(false) }),
  z.object({ mfaRequired: z.literal(true), mfaToken: z.string() }),
]);
export type LoginResult = z.infer<typeof loginResultSchema>;

const mfaCodeSchema = z
  .string()
  .length(6)
  .regex(/^\d{6}$/, "Código deve ter 6 dígitos");

export const mfaEnableInputSchema = z.object({ codigo: mfaCodeSchema });
export type MfaEnableInput = z.infer<typeof mfaEnableInputSchema>;

export const mfaDisableInputSchema = z.object({ codigo: mfaCodeSchema });
export type MfaDisableInput = z.infer<typeof mfaDisableInputSchema>;

export const mfaVerifyLoginInputSchema = z.object({
  mfaToken: z.string().min(1),
  codigo: mfaCodeSchema,
});
export type MfaVerifyLoginInput = z.infer<typeof mfaVerifyLoginInputSchema>;

export const mfaSetupOutputSchema = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
});
export type MfaSetupOutput = z.infer<typeof mfaSetupOutputSchema>;

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  tipo: publicUserTypeSchema.or(z.enum(["TECNICO", "ADMIN"])),
  nome: z.string(),
  email: z.string().email(),
  telefone: z.string().nullable(),
  telefoneVerificado: z.boolean(),
  kycStatus: z.enum(["PENDENTE", "APROVADO", "REPROVADO"]),
});
export type UserPublic = z.infer<typeof userPublicSchema>;
