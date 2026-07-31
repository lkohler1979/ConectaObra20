import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type AiConversation } from "@prisma/client";
import type {
  AiConversationPublic,
  ChatInput,
  ChatMensagem,
  ChatResponse,
} from "@conectaobra/types/ai-chat";
import type { KnowledgeSearchResult } from "@conectaobra/types/ai-knowledge";
import { PrismaService } from "../../common/prisma/prisma.service";
import { KnowledgeService } from "./knowledge.service";
import { getDisclaimer, precisaDisclaimer } from "./risk-classifier.util";

const TOP_K_FONTES = 3;

/**
 * Chat do "Engenheiro Virtual" (E5-03) — resposta SIMULADA (sem Claude API
 * real, `ANTHROPIC_API_KEY` não configurada) — decisão confirmada com o
 * usuário, mesmo espírito do PSP/embeddings simulados. Sempre cita as
 * fontes recuperadas pelo pipeline RAG (E5-01, `KnowledgeService`) e aplica
 * o disclaimer obrigatório (CLAUDE.md §5 regra 3) quando a pergunta ou as
 * fontes tocam em tema estrutural/elétrico/gás. Sem streaming real ainda.
 */
@Injectable()
export class AiChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  async chat(userId: string, input: ChatInput): Promise<ChatResponse> {
    const resultados = await this.knowledgeService.search(input.mensagem, TOP_K_FONTES);

    const categorias = resultados.map((r) => r.categoria);
    const disclaimer = precisaDisclaimer(input.mensagem, categorias) ? getDisclaimer() : null;
    const resposta = this.montarResposta(resultados);

    const mensagemUsuario: ChatMensagem = {
      role: "user",
      conteudo: input.mensagem,
      createdAt: new Date().toISOString(),
    };
    const mensagemAssistente: ChatMensagem = {
      role: "assistant",
      conteudo: resposta,
      fontes: resultados.map((r) => ({ id: r.id, titulo: r.titulo, fonte: r.fonte, url: r.url })),
      disclaimer,
      createdAt: new Date().toISOString(),
    };

    const conversa = input.conversaId
      ? await this.continuarConversa(userId, input.conversaId, mensagemUsuario, mensagemAssistente)
      : await this.criarConversa(userId, input.obraId, mensagemUsuario, mensagemAssistente);

    return {
      conversaId: conversa.id,
      resposta,
      fontes: mensagemAssistente.fontes ?? [],
      disclaimer,
      simulado: true,
    };
  }

  async listMine(userId: string): Promise<AiConversationPublic[]> {
    const conversas = await this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return conversas.map(toPublicConversation);
  }

  async getOne(userId: string, conversaId: string): Promise<AiConversationPublic> {
    const conversa = await this.getOwnedOrThrow(userId, conversaId);
    return toPublicConversation(conversa);
  }

  /** Sem chunks: resposta honesta de que não achou nada, não inventa conteúdo. */
  private montarResposta(resultados: KnowledgeSearchResult[]): string {
    if (resultados.length === 0) {
      return "Não encontrei nada na base de conhecimento pra essa pergunta ainda. Esta é uma resposta SIMULADA (sem LLM real integrado) — considere consultar um profissional habilitado pra dúvidas técnicas específicas.";
    }

    const resumo = resultados.map((r) => `"${r.titulo}" (${r.fonte})`).join(", ");
    return `Resposta SIMULADA (sem LLM real integrado ainda) com base em: ${resumo}. Veja os trechos completos em "fontes".`;
  }

  private async criarConversa(
    userId: string,
    obraId: string | undefined,
    mensagemUsuario: ChatMensagem,
    mensagemAssistente: ChatMensagem,
  ): Promise<AiConversation> {
    return this.prisma.aiConversation.create({
      data: {
        userId,
        obraId: obraId ?? null,
        mensagens: [mensagemUsuario, mensagemAssistente] as unknown as Prisma.InputJsonValue,
        tokensUsados: this.estimarTokens(mensagemUsuario.conteudo, mensagemAssistente.conteudo),
      },
    });
  }

  private async continuarConversa(
    userId: string,
    conversaId: string,
    mensagemUsuario: ChatMensagem,
    mensagemAssistente: ChatMensagem,
  ): Promise<AiConversation> {
    const conversa = await this.getOwnedOrThrow(userId, conversaId);
    const mensagensAtuais = Array.isArray(conversa.mensagens)
      ? (conversa.mensagens as unknown as ChatMensagem[])
      : [];

    return this.prisma.aiConversation.update({
      where: { id: conversaId },
      data: {
        mensagens: [
          ...mensagensAtuais,
          mensagemUsuario,
          mensagemAssistente,
        ] as unknown as Prisma.InputJsonValue,
        tokensUsados: { increment: this.estimarTokens(mensagemUsuario.conteudo, mensagemAssistente.conteudo) },
      },
    });
  }

  /** Estimativa grosseira (~4 caracteres por token) — sem LLM real, não há contagem de tokens de verdade. */
  private estimarTokens(...textos: string[]): number {
    const totalChars = textos.reduce((sum, t) => sum + t.length, 0);
    return Math.ceil(totalChars / 4);
  }

  /** Não vaza se a conversa existe e é de outro usuário — 404 nos dois casos. */
  private async getOwnedOrThrow(userId: string, conversaId: string): Promise<AiConversation> {
    const conversa = await this.prisma.aiConversation.findUnique({ where: { id: conversaId } });
    if (!conversa || conversa.userId !== userId) {
      throw new NotFoundException("Conversa não encontrada");
    }
    return conversa;
  }
}

function toPublicConversation(conversa: AiConversation): AiConversationPublic {
  return {
    id: conversa.id,
    obraId: conversa.obraId,
    mensagens: Array.isArray(conversa.mensagens) ? (conversa.mensagens as unknown as ChatMensagem[]) : [],
    tokensUsados: conversa.tokensUsados,
    createdAt: conversa.createdAt.toISOString(),
  };
}
