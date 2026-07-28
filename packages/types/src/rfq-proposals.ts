import { z } from "zod";

export const rfqProposalStatusSchema = z.enum(["ENVIADA", "ACEITA", "RECUSADA"]);
export type RfqProposalStatus = z.infer<typeof rfqProposalStatusSchema>;

export const createRfqProposalInputSchema = z.object({
  precoCentavos: z.number().int().positive(),
  prazoDias: z.number().int().positive().max(3650),
  observacoes: z.string().trim().max(2000).optional(),
});
export type CreateRfqProposalInput = z.infer<typeof createRfqProposalInputSchema>;

export const rfqProposalPublicSchema = z.object({
  id: z.string().uuid(),
  rfqId: z.string().uuid(),
  proponenteId: z.string().uuid(),
  precoCentavos: z.number().int(),
  prazoDias: z.number().int(),
  observacoes: z.string().nullable(),
  status: rfqProposalStatusSchema,
  createdAt: z.string(),
});
export type RfqProposalPublic = z.infer<typeof rfqProposalPublicSchema>;
