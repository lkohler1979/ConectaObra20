import { z } from "zod";

export const rfqStatusSchema = z.enum([
  "ABERTO",
  "EM_ANALISE",
  "CONTRATADO",
  "CANCELADO",
]);
export type RfqStatus = z.infer<typeof rfqStatusSchema>;

export const rfqIdSchema = z.string().uuid();

/** `fotos` são URLs já enviadas via POST /media/presigned-upload (E1-07). */
export const createRfqInputSchema = z.object({
  obraId: z.string().uuid(),
  categoria: z.string().trim().min(2).max(100),
  descricao: z.string().trim().min(10).max(5000),
  fotos: z.array(z.string().url()).max(20).default([]),
  prazoResposta: z.string().datetime().optional(),
  regiao: z.string().trim().min(2).max(160).optional(),
});
export type CreateRfqInput = z.infer<typeof createRfqInputSchema>;

export const updateRfqInputSchema = createRfqInputSchema.omit({ obraId: true }).partial();
export type UpdateRfqInput = z.infer<typeof updateRfqInputSchema>;

export const rfqPublicSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  clienteId: z.string().uuid(),
  categoria: z.string(),
  descricao: z.string(),
  fotos: z.array(z.string()),
  prazoResposta: z.string().nullable(),
  regiao: z.string().nullable(),
  status: rfqStatusSchema,
  createdAt: z.string(),
});
export type RfqPublic = z.infer<typeof rfqPublicSchema>;
