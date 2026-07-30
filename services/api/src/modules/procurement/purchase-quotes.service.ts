import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { MaterialListItem } from "@conectaobra/types/material-lists";
import type {
  MaterialListComparison,
  MaterialListComparisonItem,
  PurchaseQuotePublic,
  RespondPurchaseQuoteInput,
} from "@conectaobra/types/purchase-quotes";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { WorksService } from "../works/works.service";
import { toPublicPurchaseQuote } from "./purchase-quote-public.mapper";

/** Quantos fornecedores no máximo por rodada de cotação automática — mesmo tamanho do lote do matching de RFQ (E3-03). */
const QUOTE_MATCH_LIMIT = 10;

const QUOTE_INCLUDE = {
  fornecedor: { include: { user: { select: { nome: true } } } },
} satisfies Prisma.PurchaseQuoteInclude;

/**
 * Cotação automática multi-fornecedor (E7-02) — casa a lista de materiais
 * com até 10 fornecedores por `ProfileFornecedor.categorias` (sem geo/raio,
 * diferente do matching de RFQ/E3-03: entrega de material não é atendimento
 * presencial). Fornecedor responde com preço por item + frete + prazo;
 * comparador fica pra E7-03.
 */
@Injectable()
export class PurchaseQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly worksService: WorksService,
  ) {}

  async requestQuotes(clienteId: string, materialListId: string): Promise<PurchaseQuotePublic[]> {
    const list = await this.getOwnedListOrThrow(clienteId, materialListId);

    const itens = list.itens as unknown as MaterialListItem[];
    const categorias = [...new Set(itens.map((item) => item.categoria).filter(Boolean))] as string[];
    if (categorias.length === 0) {
      throw new ConflictException(
        "Nenhum item da lista tem categoria definida — não é possível buscar fornecedores automaticamente",
      );
    }

    const existing = await this.prisma.purchaseQuote.findMany({
      where: { materialListId },
      select: { fornecedorId: true },
    });
    const jaCotados = new Set(existing.map((q) => q.fornecedorId));

    const candidatos = await this.prisma.profileFornecedor.findMany({
      where: {
        categorias: { hasSome: categorias },
        userId: { notIn: [...jaCotados] },
        user: { deletedAt: null },
      },
      orderBy: { notaMedia: "desc" },
      take: QUOTE_MATCH_LIMIT,
    });

    if (candidatos.length > 0) {
      await this.prisma.purchaseQuote.createMany({
        data: candidatos.map((fornecedor) => ({
          materialListId,
          fornecedorId: fornecedor.userId,
          itensPrecos: [] as Prisma.InputJsonValue,
          status: "SOLICITADA",
        })),
      });

      await this.auditLog.record({
        userId: clienteId,
        obraId: list.obraId,
        acao: "material_list.quote_requested",
        entidade: "purchase_quote",
        payload: { materialListId, fornecedorIds: candidatos.map((f) => f.userId) },
      });
    }

    return this.listForMaterialListInternal(materialListId);
  }

  /** Dono OU membro da equipe (só leitura) — ver WorksService.assertVisible (E6-04). */
  async listForMaterialList(
    requesterId: string,
    materialListId: string,
  ): Promise<PurchaseQuotePublic[]> {
    const list = await this.getListOrThrow(materialListId);
    await this.worksService.assertVisible(requesterId, list.obraId);
    return this.listForMaterialListInternal(materialListId);
  }

  async listMine(fornecedorId: string): Promise<PurchaseQuotePublic[]> {
    const quotes = await this.prisma.purchaseQuote.findMany({
      where: { fornecedorId },
      orderBy: { createdAt: "desc" },
      include: QUOTE_INCLUDE,
    });
    return quotes.map(toPublicPurchaseQuote);
  }

  async respond(
    fornecedorId: string,
    quoteId: string,
    input: RespondPurchaseQuoteInput,
  ): Promise<PurchaseQuotePublic> {
    const quote = await this.prisma.purchaseQuote.findUnique({
      where: { id: quoteId },
      include: { materialList: { select: { obraId: true } } },
    });
    if (!quote || quote.fornecedorId !== fornecedorId) {
      throw new NotFoundException("Cotação não encontrada");
    }

    const updated = await this.prisma.purchaseQuote.update({
      where: { id: quoteId },
      data: {
        itensPrecos: input.itensPrecos as unknown as Prisma.InputJsonValue,
        freteCentavos: input.freteCentavos,
        prazoDias: input.prazoDias,
        status: "RESPONDIDA",
      },
      include: QUOTE_INCLUDE,
    });

    await this.auditLog.record({
      userId: fornecedorId,
      obraId: quote.materialList.obraId,
      acao: "purchase_quote.responded",
      entidade: "purchase_quote",
      payload: { quoteId, materialListId: quote.materialListId },
    });

    return toPublicPurchaseQuote(updated);
  }

  /**
   * Comparador (E7-03): menor preço, menor frete, melhor avaliação, menor
   * prazo. Só cotações `RESPONDIDA` entram — as pendentes não têm preço pra
   * comparar. Dono OU membro da equipe (só leitura).
   */
  async getComparison(requesterId: string, materialListId: string): Promise<MaterialListComparison> {
    const list = await this.getListOrThrow(materialListId);
    await this.worksService.assertVisible(requesterId, list.obraId);

    const quotes = await this.prisma.purchaseQuote.findMany({
      where: { materialListId, status: "RESPONDIDA" },
      include: QUOTE_INCLUDE,
    });

    if (quotes.length === 0) {
      return { materialListId, cotacoes: [] };
    }

    const calculados = quotes.map((quote) => {
      const itensPrecos = quote.itensPrecos as unknown as PurchaseQuotePublic["itensPrecos"];
      const totalItensCentavos = itensPrecos.reduce(
        (sum, item) => sum + Math.round(item.precoUnitarioCentavos * item.quantidade),
        0,
      );
      return {
        quote,
        totalCentavos: totalItensCentavos + (quote.freteCentavos ?? 0),
        notaMediaFornecedor: quote.fornecedor.notaMedia ? quote.fornecedor.notaMedia.toNumber() : null,
      };
    });

    const menorPrecoValor = Math.min(...calculados.map((c) => c.totalCentavos));
    const menorFreteValor = Math.min(...calculados.map((c) => c.quote.freteCentavos ?? Infinity));
    const menorPrazoValor = Math.min(...calculados.map((c) => c.quote.prazoDias ?? Infinity));
    const melhorAvaliacaoValor = Math.max(...calculados.map((c) => c.notaMediaFornecedor ?? -Infinity));

    const cotacoes: MaterialListComparisonItem[] = calculados
      .map(({ quote, totalCentavos, notaMediaFornecedor }) => ({
        ...toPublicPurchaseQuote(quote),
        notaMediaFornecedor,
        totalCentavos,
        menorPreco: totalCentavos === menorPrecoValor,
        menorFrete: quote.freteCentavos === menorFreteValor,
        melhorAvaliacao: (notaMediaFornecedor ?? -Infinity) === melhorAvaliacaoValor,
        menorPrazo: quote.prazoDias === menorPrazoValor,
      }))
      .sort((a, b) => a.totalCentavos - b.totalCentavos);

    return { materialListId, cotacoes };
  }

  private async listForMaterialListInternal(materialListId: string): Promise<PurchaseQuotePublic[]> {
    const quotes = await this.prisma.purchaseQuote.findMany({
      where: { materialListId },
      orderBy: { createdAt: "asc" },
      include: QUOTE_INCLUDE,
    });
    return quotes.map(toPublicPurchaseQuote);
  }

  /** Não vaza se a lista existe — 404 se não achar. */
  private async getListOrThrow(materialListId: string) {
    const list = await this.prisma.materialList.findUnique({ where: { id: materialListId } });
    if (!list) {
      throw new NotFoundException("Lista de materiais não encontrada");
    }
    return list;
  }

  /** Não vaza se a lista existe e a obra é de outro cliente — 404 nos dois casos. */
  private async getOwnedListOrThrow(clienteId: string, materialListId: string) {
    const list = await this.getListOrThrow(materialListId);
    const obra = await this.prisma.work.findUnique({ where: { id: list.obraId } });
    if (!obra || obra.clienteId !== clienteId) {
      throw new NotFoundException("Lista de materiais não encontrada");
    }
    return list;
  }
}
