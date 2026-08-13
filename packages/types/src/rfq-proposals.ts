import { z } from "zod";
import { rfqStatusSchema } from "./rfq";

export const rfqProposalStatusSchema = z.enum(["ENVIADA", "ACEITA", "RECUSADA"]);
export type RfqProposalStatus = z.infer<typeof rfqProposalStatusSchema>;

export const createRfqProposalInputSchema = z.object({
  precoCentavos: z.number().int().positive(),
  prazoDias: z.number().int().positive().max(3650),
  observacoes: z.string().trim().max(2000).optional(),
  anexos: z.array(z.string().url()).max(10).default([]),
});
export type CreateRfqProposalInput = z.infer<typeof createRfqProposalInputSchema>;

export const rfqProposalPublicSchema = z.object({
  id: z.string().uuid(),
  rfqId: z.string().uuid(),
  proponenteId: z.string().uuid(),
  proponenteNome: z.string(),
  precoCentavos: z.number().int(),
  prazoDias: z.number().int(),
  observacoes: z.string().nullable(),
  anexos: z.array(z.string()),
  status: rfqProposalStatusSchema,
  createdAt: z.string(),
});
export type RfqProposalPublic = z.infer<typeof rfqProposalPublicSchema>;

/** "Minhas propostas" (Kanban do prestador) — enriquece com o contexto do RFQ/obra, sem precisar de uma segunda chamada por proposta. */
export const rfqProposalMineSchema = rfqProposalPublicSchema.extend({
  rfqCategoria: z.string(),
  rfqStatus: rfqStatusSchema,
  obraTitulo: z.string(),
});
export type RfqProposalMine = z.infer<typeof rfqProposalMineSchema>;
