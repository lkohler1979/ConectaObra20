import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, type Promocao } from "@prisma/client";
import type {
  CreatePromocaoInput,
  PromocaoPrivate,
  UpdatePromocaoInput,
  ValidarCupomInput,
  ValidarCupomResult,
} from "@conectaobra/types/promocoes";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { AnalyticsService } from "../../../common/analytics/analytics.service";
import { toPrivatePromocao } from "./promocao-public.mapper";

/** Promoções do fornecedor (código, validade, valores, imagem) — CRUD restrito ao dono. */
@Injectable()
export class PromocoesService {
  private readonly logger = new Logger(PromocoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly analytics: AnalyticsService,
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

  /**
   * Validação de cupom no ponto de venda físico do fornecedor — não há
   * checkout online ligado a cupom hoje (ver PENDENCIAS.md P-056). Toda
   * tentativa (válida ou inválida) gera uma linha em `promocao_validacoes`,
   * base de estatística de uso futura.
   */
  async validar(fornecedorId: string, input: ValidarCupomInput): Promise<ValidarCupomResult> {
    const promocao = await this.prisma.promocao.findUnique({
      where: { fornecedorId_codigo: { fornecedorId, codigo: input.codigo } },
    });

    const agora = new Date();
    let valido = false;
    let motivo: string | null = null;

    if (!promocao) {
      motivo = "Cupom não encontrado";
    } else if (!promocao.ativa) {
      motivo = "Cupom inativo";
    } else if (promocao.validadeInicio && promocao.validadeInicio.getTime() > agora.getTime()) {
      motivo = "Cupom ainda não é válido";
    } else if (promocao.validadeFim.getTime() < agora.getTime()) {
      motivo = "Cupom expirado";
    } else {
      valido = true;
    }

    // Best-effort: falha ao registrar não pode impedir o fornecedor de ver
    // o resultado — o registro é só pra estatística futura.
    try {
      await this.prisma.promocaoValidacao.create({
        data: { fornecedorId, promocaoId: promocao?.id, codigo: input.codigo, valido, motivo },
      });
    } catch (err) {
      this.logger.error(
        `Falha ao registrar validação de cupom (fornecedor ${fornecedorId})`,
        err as Error,
      );
    }

    this.analytics.capture(fornecedorId, "cupom_validado", {
      codigo: input.codigo,
      valido,
      promocaoId: promocao?.id,
    });

    return {
      valido,
      motivo,
      promocao: valido && promocao ? toPrivatePromocao(promocao) : null,
    };
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
