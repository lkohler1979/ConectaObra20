import { z } from "zod";

/**
 * Marketplace público de sobra de material de obra — cliente dono de uma
 * obra anuncia material excedente, qualquer pessoa do público compra via
 * checkout de convidado (sem exigir conta).
 */
export const surplusListingStatusSchema = z.enum([
  "DISPONIVEL",
  "RESERVADO",
  "VENDIDO",
  "REMOVIDO",
]);
export type SurplusListingStatus = z.infer<typeof surplusListingStatusSchema>;

export const surplusListingIdSchema = z.string().uuid();

export const createSurplusListingInputSchema = z.object({
  workId: z.string().uuid(),
  nome: z.string().trim().min(2, "Nome obrigatório").max(150),
  descricao: z.string().trim().min(2, "Descrição obrigatória").max(2000),
  categoria: z.string().trim().min(2).max(100),
  quantidade: z.coerce.number().positive(),
  unidade: z.string().trim().min(1).max(30),
  precoCentavos: z.coerce.number().int().positive(),
  fotos: z.array(z.string().url()).max(20).default([]),
});
export type CreateSurplusListingInput = z.infer<typeof createSurplusListingInputSchema>;

export const updateSurplusListingInputSchema = z.object({
  status: surplusListingStatusSchema,
});
export type UpdateSurplusListingInput = z.infer<typeof updateSurplusListingInputSchema>;

export const surplusListingPublicSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  clienteId: z.string().uuid(),
  clienteNome: z.string(),
  nome: z.string(),
  descricao: z.string(),
  categoria: z.string(),
  quantidade: z.number(),
  unidade: z.string(),
  precoCentavos: z.number(),
  fotos: z.array(z.string()),
  status: surplusListingStatusSchema,
  createdAt: z.string(),
});
export type SurplusListingPublic = z.infer<typeof surplusListingPublicSchema>;

/** Visto só pelo dono do anúncio (`/surplus-listings/mine`) — inclui dados do comprador se vendido. */
export const surplusListingOwnerSchema = surplusListingPublicSchema.extend({
  order: z
    .object({
      compradorNome: z.string(),
      compradorEmail: z.string(),
      compradorTelefone: z.string().nullable(),
      createdAt: z.string(),
    })
    .nullable(),
});
export type SurplusListingOwner = z.infer<typeof surplusListingOwnerSchema>;

export const surplusCheckoutInputSchema = z.object({
  compradorNome: z.string().trim().min(2, "Nome obrigatório").max(150),
  compradorEmail: z.string().trim().email("E-mail inválido"),
  compradorTelefone: z.string().trim().min(8).max(30).optional(),
});
export type SurplusCheckoutInput = z.infer<typeof surplusCheckoutInputSchema>;

export const surplusListingsQuerySchema = z.object({
  categoria: z.string().trim().max(100).optional(),
  q: z.string().trim().max(200).optional(),
});
export type SurplusListingsQuery = z.infer<typeof surplusListingsQuerySchema>;

export const mySurplusListingsQuerySchema = z.object({
  workId: z.string().uuid().optional(),
});
export type MySurplusListingsQuery = z.infer<typeof mySurplusListingsQuerySchema>;

export const surplusOrderPublicSchema = z.object({
  id: z.string().uuid(),
  surplusListingId: z.string().uuid(),
  itemPrecoCentavos: z.number(),
  comissaoCentavos: z.number(),
  totalPagoCentavos: z.number(),
  pspRef: z.string(),
  status: z.literal("PAGO"),
  createdAt: z.string(),
});
export type SurplusOrderPublic = z.infer<typeof surplusOrderPublicSchema>;
