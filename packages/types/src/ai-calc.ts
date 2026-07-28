import { z } from "zod";

/**
 * Calculadoras determinísticas (E5-04) — CLAUDE.md §5 regra 3: cálculos
 * quantitativos usam código, nunca "de cabeça" do LLM. Concreto/blocos/
 * argamassa são temas estruturais: toda resposta inclui `disclaimer`
 * recomendando validação por profissional habilitado (ART/RRT), também
 * exigido pela mesma regra. Coeficientes usados são valores de referência
 * amplamente publicados em guias de construção civil — não são texto de
 * NBR — e ainda não passaram por revisão de engenheiro civil (P-012); ver
 * PENDENCIAS.md.
 */

export const concretoInputSchema = z.object({
  volumeM3: z.number().positive().max(1000),
  /** Traço em volume — cimento é sempre "1 parte" (ex: traço 1:2:3 → partesAreia=2, partesBrita=3). */
  partesAreia: z.number().positive().max(20).default(2),
  partesBrita: z.number().positive().max(20).default(3),
});
export type ConcretoInput = z.infer<typeof concretoInputSchema>;

export const concretoOutputSchema = z.object({
  sacosCimento50kg: z.number().int(),
  areiaM3: z.number(),
  britaM3: z.number(),
  aguaLitros: z.number(),
  disclaimer: z.string(),
});
export type ConcretoOutput = z.infer<typeof concretoOutputSchema>;

const blocoDimensoesSchema = {
  blocoComprimentoCm: z.number().positive().max(200).default(39),
  blocoAlturaCm: z.number().positive().max(200).default(19),
  espessuraJuntaCm: z.number().positive().max(5).default(1),
  percentualPerda: z.number().min(0).max(0.5).default(0.1),
};

export const blocosInputSchema = z.object({
  areaParedeM2: z.number().positive().max(10000),
  ...blocoDimensoesSchema,
});
export type BlocosInput = z.infer<typeof blocosInputSchema>;

export const blocosOutputSchema = z.object({
  blocosPorM2: z.number(),
  quantidadeBlocos: z.number().int(),
  disclaimer: z.string(),
});
export type BlocosOutput = z.infer<typeof blocosOutputSchema>;

export const argamassaInputSchema = z.object({
  areaParedeM2: z.number().positive().max(10000),
  ...blocoDimensoesSchema,
  blocoLarguraCm: z.number().positive().max(100).default(14),
});
export type ArgamassaInput = z.infer<typeof argamassaInputSchema>;

export const argamassaOutputSchema = z.object({
  volumeArgamassaM3: z.number(),
  disclaimer: z.string(),
});
export type ArgamassaOutput = z.infer<typeof argamassaOutputSchema>;

export const tintaInputSchema = z.object({
  areaM2: z.number().positive().max(100000),
  numeroDemaos: z.number().int().positive().max(5).default(2),
  /** m² cobertos por litro numa demão — varia por produto; confira o rendimento informado na embalagem. */
  rendimentoM2PorLitro: z.number().positive().max(50).default(6),
});
export type TintaInput = z.infer<typeof tintaInputSchema>;

export const tintaOutputSchema = z.object({
  litrosNecessarios: z.number(),
  disclaimer: z.string(),
});
export type TintaOutput = z.infer<typeof tintaOutputSchema>;
