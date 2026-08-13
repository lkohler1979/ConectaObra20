import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Avaliacao } from "@prisma/client";
import type {
  AvaliacaoPublic,
  AvaliacaoResumo,
  CreateAvaliacaoInput,
} from "@conectaobra/types/avaliacoes";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicAvaliacao } from "./avaliacao-public.mapper";

const INCLUDE = {
  autor: { select: { nome: true } },
  obra: { select: { titulo: true } },
} satisfies Prisma.AvaliacaoInclude;

type AvaliacaoWithRelations = Avaliacao & {
  autor: { nome: string };
  obra: { titulo: string } | null;
};

/**
 * Avaliação/comentário aberto — complementa `ReviewsService` (contratos),
 * que continua exigindo contrato + etapa aprovada. Prestador é sempre
 * cadastrado a partir da obra do próprio autor (só o dono avalia); fornecedor
 * e produto não têm vínculo de obra e podem ser avaliados por qualquer
 * usuário logado.
 */
@Injectable()
export class AvaliacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async criarOuAtualizar(autorId: string, input: CreateAvaliacaoInput): Promise<AvaliacaoPublic> {
    if (input.tipo === "PRESTADOR") {
      return this.criarOuAtualizarPrestador(autorId, input);
    }
    if (input.tipo === "FORNECEDOR") {
      return this.criarOuAtualizarFornecedor(autorId, input);
    }
    return this.criarOuAtualizarProduto(autorId, input);
  }

  private async criarOuAtualizarPrestador(
    autorId: string,
    input: Extract<CreateAvaliacaoInput, { tipo: "PRESTADOR" }>,
  ): Promise<AvaliacaoPublic> {
    // Só o dono da obra cadastra/avalia um prestador nela — mesma checagem
    // 404-pra-quem-não-é-dono usada em WorksService/WorkTeamService.
    const obra = await this.prisma.work.findUnique({ where: { id: input.obraId } });
    if (!obra || obra.clienteId !== autorId) {
      throw new NotFoundException("Obra não encontrada");
    }

    const prestador = await this.prisma.user.findUnique({
      where: { email: input.prestadorEmail },
    });
    if (
      !prestador ||
      prestador.deletedAt ||
      (prestador.tipo !== "PRESTADOR" && prestador.tipo !== "TECNICO")
    ) {
      throw new NotFoundException("Prestador não encontrado");
    }

    const { avaliacao, criada } = await this.upsert(
      { autorId, tipo: "PRESTADOR", prestadorId: prestador.id, obraId: obra.id },
      {
        autorId,
        tipo: "PRESTADOR",
        prestadorId: prestador.id,
        obraId: obra.id,
        nota: input.nota,
        comentario: input.comentario,
      },
    );

    await this.auditLog.record({
      userId: autorId,
      obraId: obra.id,
      acao: criada ? "avaliacao.created" : "avaliacao.updated",
      entidade: "avaliacao",
      payload: { avaliacaoId: avaliacao.id, tipo: "PRESTADOR", prestadorId: prestador.id },
    });

    return toPublicAvaliacao(avaliacao);
  }

  private async criarOuAtualizarFornecedor(
    autorId: string,
    input: Extract<CreateAvaliacaoInput, { tipo: "FORNECEDOR" }>,
  ): Promise<AvaliacaoPublic> {
    const fornecedor = await this.prisma.user.findFirst({
      where: { id: input.fornecedorId, tipo: "FORNECEDOR", deletedAt: null },
    });
    if (!fornecedor) {
      throw new NotFoundException("Fornecedor não encontrado");
    }

    const { avaliacao, criada } = await this.upsert(
      { autorId, tipo: "FORNECEDOR", fornecedorId: fornecedor.id },
      {
        autorId,
        tipo: "FORNECEDOR",
        fornecedorId: fornecedor.id,
        nota: input.nota,
        comentario: input.comentario,
      },
    );

    await this.auditLog.record({
      userId: autorId,
      acao: criada ? "avaliacao.created" : "avaliacao.updated",
      entidade: "avaliacao",
      payload: { avaliacaoId: avaliacao.id, tipo: "FORNECEDOR", fornecedorId: fornecedor.id },
    });

    return toPublicAvaliacao(avaliacao);
  }

  private async criarOuAtualizarProduto(
    autorId: string,
    input: Extract<CreateAvaliacaoInput, { tipo: "PRODUTO" }>,
  ): Promise<AvaliacaoPublic> {
    const produto = await this.prisma.product.findUnique({ where: { id: input.produtoId } });
    if (!produto) {
      throw new NotFoundException("Produto não encontrado");
    }

    const { avaliacao, criada } = await this.upsert(
      { autorId, tipo: "PRODUTO", produtoId: produto.id },
      {
        autorId,
        tipo: "PRODUTO",
        produtoId: produto.id,
        nota: input.nota,
        comentario: input.comentario,
      },
    );

    await this.auditLog.record({
      userId: autorId,
      acao: criada ? "avaliacao.created" : "avaliacao.updated",
      entidade: "avaliacao",
      payload: { avaliacaoId: avaliacao.id, tipo: "PRODUTO", produtoId: produto.id },
    });

    return toPublicAvaliacao(avaliacao);
  }

  /** "Editar minha avaliação" em vez de duplicar — sem `@@unique` (colunas nuláveis não bloqueiam duplicata no Postgres). */
  private async upsert(
    where: Prisma.AvaliacaoWhereInput,
    data: Prisma.AvaliacaoUncheckedCreateInput,
  ): Promise<{ avaliacao: AvaliacaoWithRelations; criada: boolean }> {
    const existente = await this.prisma.avaliacao.findFirst({ where });
    if (existente) {
      const avaliacao = await this.prisma.avaliacao.update({
        where: { id: existente.id },
        data: { nota: data.nota, comentario: data.comentario },
        include: INCLUDE,
      });
      return { avaliacao, criada: false };
    }
    const avaliacao = await this.prisma.avaliacao.create({ data, include: INCLUDE });
    return { avaliacao, criada: true };
  }

  async listByPrestador(prestadorId: string, obraId?: string): Promise<AvaliacaoPublic[]> {
    const avaliacoes = await this.prisma.avaliacao.findMany({
      where: { tipo: "PRESTADOR", prestadorId, oculta: false, ...(obraId ? { obraId } : {}) },
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return avaliacoes.map(toPublicAvaliacao);
  }

  async listByFornecedor(fornecedorId: string): Promise<AvaliacaoPublic[]> {
    const avaliacoes = await this.prisma.avaliacao.findMany({
      where: { tipo: "FORNECEDOR", fornecedorId, oculta: false },
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return avaliacoes.map(toPublicAvaliacao);
  }

  async listByProduto(produtoId: string): Promise<AvaliacaoPublic[]> {
    const avaliacoes = await this.prisma.avaliacao.findMany({
      where: { tipo: "PRODUTO", produtoId, oculta: false },
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return avaliacoes.map(toPublicAvaliacao);
  }

  /** Usado por `GET /works/:id/avaliacoes-prestadores` — visibilidade checada no controller. */
  async listByObra(obraId: string): Promise<AvaliacaoPublic[]> {
    const avaliacoes = await this.prisma.avaliacao.findMany({
      where: { tipo: "PRESTADOR", obraId, oculta: false },
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return avaliacoes.map(toPublicAvaliacao);
  }

  async resumoPrestador(prestadorId: string, obraId?: string): Promise<AvaliacaoResumo> {
    return this.resumo({ tipo: "PRESTADOR", prestadorId, ...(obraId ? { obraId } : {}) });
  }

  async resumoFornecedor(fornecedorId: string): Promise<AvaliacaoResumo> {
    return this.resumo({ tipo: "FORNECEDOR", fornecedorId });
  }

  async resumoProduto(produtoId: string): Promise<AvaliacaoResumo> {
    return this.resumo({ tipo: "PRODUTO", produtoId });
  }

  private async resumo(where: Prisma.AvaliacaoWhereInput): Promise<AvaliacaoResumo> {
    const agg = await this.prisma.avaliacao.aggregate({
      where: { ...where, oculta: false },
      _avg: { nota: true },
      _count: true,
    });
    return { notaMedia: agg._avg.nota, total: agg._count };
  }
}
