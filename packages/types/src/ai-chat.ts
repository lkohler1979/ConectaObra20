import { z } from "zod";

/**
 * Chat do "Engenheiro Virtual" (E5-03) — resposta SIMULADA (sem Claude API
 * real integrada ainda, `ANTHROPIC_API_KEY` não configurada) — decisão
 * confirmada com o usuário, mesmo espírito do PSP/embeddings simulados.
 * Sempre cita as fontes recuperadas pelo pipeline RAG (E5-01) via `fontes`;
 * `disclaimer` é obrigatório pra tema estrutural/elétrico/gás (CLAUDE.md
 * §5 regra 3). Sem streaming real ainda — a resposta vem inteira de uma vez.
 */
export const conversaIdSchema = z.string().uuid();

export const chatInputSchema = z.object({
  mensagem: z.string().trim().min(3).max(2000),
  obraId: z.string().uuid().optional(),
  conversaId: z.string().uuid().optional(),
});
export type ChatInput = z.infer<typeof chatInputSchema>;

export const chatFonteSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  fonte: z.string(),
  url: z.string().nullable(),
});
export type ChatFonte = z.infer<typeof chatFonteSchema>;

export const chatMensagemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  conteudo: z.string(),
  fontes: z.array(chatFonteSchema).optional(),
  disclaimer: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type ChatMensagem = z.infer<typeof chatMensagemSchema>;

export const chatResponseSchema = z.object({
  conversaId: z.string().uuid(),
  resposta: z.string(),
  fontes: z.array(chatFonteSchema),
  disclaimer: z.string().nullable(),
  simulado: z.literal(true),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const aiConversationPublicSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid().nullable(),
  mensagens: z.array(chatMensagemSchema),
  tokensUsados: z.number().int(),
  createdAt: z.string(),
});
export type AiConversationPublic = z.infer<typeof aiConversationPublicSchema>;
