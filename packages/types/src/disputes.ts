import { z } from "zod";

export const disputeIdSchema = z.string().uuid();

/**
 * Disputa de etapa (E4-09) — qualquer parte do contrato pode abrir; abrir
 * congela a etapa (`Milestone.status = EM_DISPUTA`), o que já bloqueia
 * iniciar/entregar/aprovar sozinho (os guards de status existentes não
 * casam com `EM_DISPUTA`) — "disputa congela liberação imediatamente"
 * (CLAUDE.md/checklist B.3).
 */
export const abrirDisputeInputSchema = z.object({
  motivo: z.string().trim().min(10, "Descreva o motivo com pelo menos 10 caracteres"),
  evidencias: z.array(z.string().url()).min(1, "Anexe pelo menos uma evidência").max(20),
});
export type AbrirDisputeInput = z.infer<typeof abrirDisputeInputSchema>;

export const disputeDecisaoSchema = z.enum(["APROVAR", "ESTORNAR", "LIBERAR_PARCIAL"]);
export type DisputeDecisao = z.infer<typeof disputeDecisaoSchema>;

/**
 * Mediação (E4-09/E4-10) — exclusiva do ADMIN. `APROVAR` reverte a etapa
 * pra `ENTREGUE` (segue o fluxo normal de aprovação); `ESTORNAR`/
 * `LIBERAR_PARCIAL` só fazem sentido se a etapa teve depósito em custódia
 * (senão não há valor pra mover) — ver `EscrowService`.
 */
export const resolverDisputeInputSchema = z
  .object({
    decisao: disputeDecisaoSchema,
    resolucao: z.string().trim().min(10, "Descreva a resolução com pelo menos 10 caracteres"),
    valorLiberadoCentavos: z.number().int().positive().optional(),
  })
  .refine((data) => data.decisao !== "LIBERAR_PARCIAL" || data.valorLiberadoCentavos !== undefined, {
    message: "Informe valorLiberadoCentavos para liberação parcial",
    path: ["valorLiberadoCentavos"],
  });
export type ResolverDisputeInput = z.infer<typeof resolverDisputeInputSchema>;

export const disputeStatusSchema = z.enum(["ABERTA", "RESOLVIDA"]);
export type DisputeStatus = z.infer<typeof disputeStatusSchema>;

export const disputePublicSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  abertoPorId: z.string().uuid(),
  motivo: z.string(),
  evidencias: z.array(z.string()),
  mediadorId: z.string().uuid().nullable(),
  resolucao: z.string().nullable(),
  status: disputeStatusSchema,
  createdAt: z.string(),
});
export type DisputePublic = z.infer<typeof disputePublicSchema>;

/**
 * Fila de mediação do ADMIN (E10-01) — mesma disputa, com o contexto
 * mínimo pra decidir com segurança (de qual obra/etapa, quanto dinheiro
 * está em jogo, quem abriu). Só usada em `GET /disputas` (já exclusivo do
 * ADMIN) — `listForMilestone` (partes do contrato) continua em `DisputePublic`.
 */
export const adminDisputeSchema = disputePublicSchema.extend({
  obraId: z.string().uuid(),
  obraTitulo: z.string(),
  milestoneDescricao: z.string(),
  milestoneValorCentavos: z.number().int(),
  abertoPorNome: z.string(),
});
export type AdminDispute = z.infer<typeof adminDisputeSchema>;
