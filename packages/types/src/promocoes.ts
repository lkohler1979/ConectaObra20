import { z } from "zod";

/**
 * Promoções do fornecedor (código, validade, valores, imagem) — divulgadas
 * numa página pública sem login, com destaque opcional na home.
 * Valores sempre em centavos (CLAUDE.md §5 regra 1).
 */
export const createPromocaoInputSchema = z
  .object({
    codigo: z.string().trim().min(1, "Código obrigatório").max(40),
    nome: z.string().trim().min(1, "Nome obrigatório").max(150),
    descricao: z.string().trim().min(1, "Descrição obrigatória").max(2000),
    valorOriginalCentavos: z.number().int().positive().optional(),
    valorPromocionalCentavos: z.number().int().positive(),
    imagemUrl: z.string().url().optional(),
    validadeInicio: z.coerce.date().optional(),
    validadeFim: z.coerce.date(),
    destaque: z.boolean().optional(),
    ativa: z.boolean().optional(),
  })
  .refine((data) => data.validadeFim.getTime() > Date.now(), {
    message: "Validade deve ser uma data futura",
    path: ["validadeFim"],
  })
  .refine(
    (data) =>
      !data.validadeInicio || data.validadeInicio.getTime() < data.validadeFim.getTime(),
    {
      message: "Início da validade deve ser antes do fim",
      path: ["validadeInicio"],
    },
  );
export type CreatePromocaoInput = z.infer<typeof createPromocaoInputSchema>;

export const updatePromocaoInputSchema = z.object({
  codigo: z.string().trim().min(1).max(40).optional(),
  nome: z.string().trim().min(1).max(150).optional(),
  descricao: z.string().trim().min(1).max(2000).optional(),
  valorOriginalCentavos: z.number().int().positive().nullable().optional(),
  valorPromocionalCentavos: z.number().int().positive().optional(),
  imagemUrl: z.string().url().nullable().optional(),
  validadeInicio: z.coerce.date().nullable().optional(),
  validadeFim: z.coerce.date().optional(),
  destaque: z.boolean().optional(),
  ativa: z.boolean().optional(),
});
export type UpdatePromocaoInput = z.infer<typeof updatePromocaoInputSchema>;

export const promocaoIdSchema = z.string().uuid();

/** Visão do dono (fornecedor) — inclui código, ativa/destaque e todo o histórico. */
export const promocaoPrivateSchema = z.object({
  id: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string(),
  valorOriginalCentavos: z.number().int().nullable(),
  valorPromocionalCentavos: z.number().int(),
  imagemUrl: z.string().nullable(),
  validadeInicio: z.string().nullable(),
  validadeFim: z.string(),
  destaque: z.boolean(),
  ativa: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PromocaoPrivate = z.infer<typeof promocaoPrivateSchema>;

/** Visão pública (sem login) — só promoções ativas e dentro da validade. */
export const promocaoPublicSchema = z.object({
  id: z.string().uuid(),
  fornecedorId: z.string().uuid(),
  fornecedorNome: z.string(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string(),
  valorOriginalCentavos: z.number().int().nullable(),
  valorPromocionalCentavos: z.number().int(),
  imagemUrl: z.string().nullable(),
  validadeFim: z.string(),
  destaque: z.boolean(),
});
export type PromocaoPublic = z.infer<typeof promocaoPublicSchema>;

/** Cupom de desconto — validação feita pelo fornecedor no ponto de venda. */
export const validarCupomInputSchema = z.object({
  codigo: z.string().trim().min(1, "Código obrigatório").max(40),
});
export type ValidarCupomInput = z.infer<typeof validarCupomInputSchema>;

export const validarCupomResultSchema = z.object({
  valido: z.boolean(),
  motivo: z.string().nullable(),
  promocao: promocaoPrivateSchema.nullable(),
});
export type ValidarCupomResult = z.infer<typeof validarCupomResultSchema>;

/** Query da listagem pública — `destaque=true` filtra só as promoções em destaque na home. */
export const listPublicPromocoesQuerySchema = z.object({
  destaque: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type ListPublicPromocoesQuery = z.infer<typeof listPublicPromocoesQuerySchema>;
