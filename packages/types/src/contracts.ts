import { z } from "zod";
import { milestonePublicSchema } from "./milestones";

export const contractPartyRoleSchema = z.enum(["CONTRATANTE", "CONTRATADO"]);
export type ContractPartyRole = z.infer<typeof contractPartyRoleSchema>;

export const proposalIdSchema = z.string().uuid();
export const contractIdSchema = z.string().uuid();

/**
 * `status` fica livre (String) — o doc 02 §3 não enumera os estados de
 * contrato; aqui só existe "rascunho" (E3-07). PDF e assinatura eletrônica
 * são E4-01/E4-02.
 */
export const contractPublicSchema = z.object({
  id: z.string().uuid(),
  rfqProposalId: z.string().uuid(),
  obraId: z.string().uuid(),
  valorTotalCentavos: z.number().int(),
  status: z.string(),
  pdfUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type ContractPublic = z.infer<typeof contractPublicSchema>;

/**
 * Listagem "meus contratos" (E4/E6, frontend) — enriquece `ContractPublic`
 * com o mínimo pra navegação/exibição sem precisar de uma segunda chamada:
 * de qual obra é e qual o meu papel nele (decide o que a tela mostra —
 * cliente define/aprova etapas, contratado inicia/entrega).
 */
export const contractListItemSchema = contractPublicSchema.extend({
  obraTitulo: z.string(),
  meuPapel: contractPartyRoleSchema,
  milestones: z.array(milestonePublicSchema),
});
export type ContractListItem = z.infer<typeof contractListItemSchema>;
