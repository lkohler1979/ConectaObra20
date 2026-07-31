import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Promocao } from "@prisma/client";
import type {
  CreatePromocaoInput,
  PromocaoPrivate,
  UpdatePromocaoInput,
} from "@conectaobra/types/promocoes";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { toPrivatePromocao } from "./promocao-public.mapper";

/** Promoções do fornecedor (código, validade, valores, imagem) — CRUD restrito ao dono. */
@Injectable()
export class PromocoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(fornecedorId: string, input: CreatePromocaoInput): Promise<PromocaoPrivate> {
    const perfil = await this.prisma.profileFornecedor.findUnique({
      where: { userId: fornecedorId },
    });
    if (!perfil) {
      throw new ConflictException(
        "Complete seu perfil de fornecedor (PUT /profile/fornecedor) antes de cadastrar promoções",
      );
    }

    let promocao: Promocao;
    try {
      promocao = await this.prisma.promocao.create({
        data: {
          fornecedorId,
          codigo: input.codigo,
          nome: input.nome,
          descricao: input.descricao,
          valorOriginalCentavos: input.valorOriginalCentavos,
          valorPromocionalCentavos: input.valorPromocionalCentavos,
          imagemUrl: input.imagemUrl,
          validadeInicio: input.validadeInicio,
          validadeFim: input.validadeFim,
          destaque: input.destaque ?? false,
          ativa: input.ativa ?? true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Você já tem uma promoção com este código");
      }
      throw error;
    }

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "promocao.created",
      entidade: "promocao",
      payload: { promocaoId: promocao.id, codigo: promocao.codigo },
    });

    return toPrivatePromocao(promocao);
  }

  async listMine(fornecedorId: string): Promise<PromocaoPrivate[]> {
    const promocoes = await this.prisma.promocao.findMany({
      where: { fornecedorId },
      orderBy: { createdAt: "desc" },
    });
    return promocoes.map(toPrivatePromocao);
  }

  async update(
    fornecedorId: string,
    promocaoId: string,
    input: UpdatePromocaoInput,
  ): Promise<PromocaoPrivate> {
    await this.getOwnedOrThrow(fornecedorId, promocaoId);

    let promocao: Promocao;
    try {
      promocao = await this.prisma.promocao.update({
        where: { id: promocaoId },
        data: {
          codigo: input.codigo,
          nome: input.nome,
          descricao: input.descricao,
          valorOriginalCentavos: input.valorOriginalCentavos,
          valorPromocionalCentavos: input.valorPromocionalCentavos,
          imagemUrl: input.imagemUrl,
          validadeInicio: input.validadeInicio,
          validadeFim: input.validadeFim,
          destaque: input.destaque,
          ativa: input.ativa,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Você já tem uma promoção com este código");
      }
      throw error;
    }

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "promocao.updated",
      entidade: "promocao",
      payload: { promocaoId },
    });

    return toPrivatePromocao(promocao);
  }

  async remove(fornecedorId: string, promocaoId: string): Promise<void> {
    await this.getOwnedOrThrow(fornecedorId, promocaoId);

    await this.prisma.promocao.delete({ where: { id: promocaoId } });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "promocao.deleted",
      entidade: "promocao",
      payload: { promocaoId },
    });
  }

  /** Não vaza se a promoção existe e é de outro fornecedor — 404 nos dois casos. */
  private async getOwnedOrThrow(fornecedorId: string, promocaoId: string): Promise<Promocao> {
    const promocao = await this.prisma.promocao.findUnique({ where: { id: promocaoId } });
    if (!promocao || promocao.fornecedorId !== fornecedorId) {
      throw new NotFoundException("Promoção não encontrada");
    }
    return promocao;
  }
}
