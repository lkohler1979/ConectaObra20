import { z } from "zod";

/**
 * Avaliação/comentário aberto — complementa `Review` (contratos/reviews.ts),
 * que continua exigindo contrato + etapa aprovada. Prestador sempre ligado a
 * uma obra do próprio autor (criado a partir de /obras/[id]); fornecedor e
 * produto não têm vínculo de obra e podem ser avaliados por qualquer usuário
 * logado.
 */
export const avaliacaoTipoSchema = z.enum(["PRESTADOR", "FORNECEDOR", "PRODUTO"]);
export type AvaliacaoTipo = z.infer<typeof avaliacaoTipoSchema>;

const notaSchema = z.number().int().min(1, "Nota mínima é 1").max(5, "Nota máxima é 5");
const comentarioSchema = z.string().trim().max(2000).optional();

export const createAvaliacaoInputSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("PRESTADOR"),
    prestadorEmail: z.string().trim().toLowerCase().email("E-mail inválido"),
    obraId: z.string().uuid(),
    nota: notaSchema,
    comentario: comentarioSchema,
  }),
  z.object({
    tipo: z.literal("FORNECEDOR"),
    fornecedorId: z.string().uuid(),
    nota: notaSchema,
    comentario: comentarioSchema,
  }),
  z.object({
    tipo: z.literal("PRODUTO"),
    produtoId: z.string().uuid(),
    nota: notaSchema,
    comentario: comentarioSchema,
  }),
]);
export type CreateAvaliacaoInput = z.infer<typeof createAvaliacaoInputSchema>;

export const avaliacaoPublicSchema = z.object({
  id: z.string().uuid(),
  autorNome: z.string(),
  tipo: avaliacaoTipoSchema,
  obraId: z.string().uuid().nullable(),
  obraTitulo: z.string().nullable(),
  nota: z.number().int(),
  comentario: z.string().nullable(),
  createdAt: z.string(),
});
export type AvaliacaoPublic = z.infer<typeof avaliacaoPublicSchema>;

export const avaliacaoResumoSchema = z.object({
  notaMedia: z.number().nullable(),
  total: z.number().int(),
});
export type AvaliacaoResumo = z.infer<typeof avaliacaoResumoSchema>;

export const avaliacaoListResponseSchema = z.object({
  resumo: avaliacaoResumoSchema,
  itens: z.array(avaliacaoPublicSchema),
});
export type AvaliacaoListResponse = z.infer<typeof avaliacaoListResponseSchema>;

/**
 * Moderação de conteúdo (P-091) — ADMIN oculta/reativa uma avaliação depois
 * de publicada (reativa, não pré-aprovação: sem canal de notificação pra
 * avisar o autor de uma fila pendente). Mesmo padrão de `User.suspenso`
 * (E10-01) — flag + motivo + data, sem histórico dedicado (reaproveita
 * `audit_log`).
 */
export const avaliacaoAdminSchema = z.object({
  id: z.string().uuid(),
  tipo: avaliacaoTipoSchema,
  autorNome: z.string(),
  autorEmail: z.string(),
  prestadorNome: z.string().nullable(),
  fornecedorNome: z.string().nullable(),
  produtoNome: z.string().nullable(),
  obraTitulo: z.string().nullable(),
  nota: z.number().int(),
  comentario: z.string().nullable(),
  oculta: z.boolean(),
  ocultaMotivo: z.string().nullable(),
  ocultaEm: z.string().nullable(),
  createdAt: z.string(),
});
export type AvaliacaoAdmin = z.infer<typeof avaliacaoAdminSchema>;

export const avaliacaoAdminIdSchema = z.string().uuid();

export const listAdminAvaliacoesQuerySchema = z.object({
  tipo: avaliacaoTipoSchema.optional(),
  oculta: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type ListAdminAvaliacoesQuery = z.infer<typeof listAdminAvaliacoesQuerySchema>;

export const ocultarAvaliacaoInputSchema = z.object({
  motivo: z.string().trim().min(3, "Motivo obrigatório").max(500),
});
export type OcultarAvaliacaoInput = z.infer<typeof ocultarAvaliacaoInputSchema>;
