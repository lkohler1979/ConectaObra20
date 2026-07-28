import { z } from "zod";

/**
 * Versão única enquanto docs/legal ainda não tem os textos reais dos
 * documentos — trocar por versionamento por documento quando existirem
 * (ver PENDENCIAS.md P-019).
 */
export const consentTypeSchema = z.enum([
  "TERMOS_USO",
  "POLITICA_PRIVACIDADE",
  "COMUNICACAO_MARKETING",
]);
export type ConsentType = z.infer<typeof consentTypeSchema>;

/** Só COMUNICACAO_MARKETING pode ser alterado aqui — os obrigatórios são aceitos no cadastro. */
export const recordConsentInputSchema = z.object({
  tipo: z.literal("COMUNICACAO_MARKETING"),
  aceito: z.boolean(),
});
export type RecordConsentInput = z.infer<typeof recordConsentInputSchema>;

export const legalVersionsSchema = z.object({
  versao: z.string(),
});
export type LegalVersions = z.infer<typeof legalVersionsSchema>;

export const deleteAccountInputSchema = z.object({
  senha: z.string().min(1),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;
