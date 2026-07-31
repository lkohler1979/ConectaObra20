import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type MaterialList, type Work } from "@prisma/client";
import type {
  CreateMaterialListInput,
  GerarListaMateriaisInput,
  MaterialListPublic,
  UpdateMaterialListInput,
} from "@conectaobra/types/material-lists";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { WorksService } from "../works/works.service";
import { MaterialGeneratorService } from "../ai/material-generator.service";
import { toPublicMaterialList } from "./material-list-public.mapper";

/**
 * Lista de materiais (E7-01) — criação manual ou via IA (E5-07,
 * `origem: IA`, SIMULADA — ver `MaterialGeneratorService`).
 */
@Injectable()
export class MaterialListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly worksService: WorksService,
    private readonly materialGenerator: MaterialGeneratorService,
  ) {}

  async create(clienteId: string, input: CreateMaterialListInput): Promise<MaterialListPublic> {
    await this.getOwnedObraOrThrow(clienteId, input.obraId);

    const list = await this.prisma.materialList.create({
      data: {
        obraId: input.obraId,
        itens: input.itens as unknown as Prisma.InputJsonValue,
        origem: "MANUAL",
      },
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: input.obraId,
      acao: "material_list.created",
      entidade: "material_list",
      payload: { materialListId: list.id, quantidadeItens: input.itens.length },
    });

    return toPublicMaterialList(list);
  }

  /**
   * Geração via IA (E5-07) — SIMULADA, ver `MaterialGeneratorService`. 409
   * se nenhuma regra bateu com a descrição (nenhum item fabricado do nada).
   */
  async gerarComIA(
    clienteId: string,
    input: GerarListaMateriaisInput,
  ): Promise<MaterialListPublic> {
    await this.getOwnedObraOrThrow(clienteId, input.obraId);

    const itens = this.materialGenerator.gerar(input.descricao, input.areaM2);
    if (itens.length === 0) {
      throw new ConflictException(
        "Não consegui identificar nenhum material a partir dessa descrição — tente detalhar mais (ex.: cite pintura, piso, elétrica, hidráulica ou alvenaria)",
      );
    }

    const list = await this.prisma.materialList.create({
      data: {
        obraId: input.obraId,
        itens: itens as unknown as Prisma.InputJsonValue,
        origem: "IA",
      },
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: input.obraId,
      acao: "material_list.created_ia",
      entidade: "material_list",
      payload: { materialListId: list.id, quantidadeItens: itens.length, simulado: true },
    });

    return toPublicMaterialList(list);
  }

  /** Dono OU membro da equipe (só leitura) — ver WorksService.assertVisible (E6-04). */
  async listForObra(requesterId: string, obraId: string): Promise<MaterialListPublic[]> {
    await this.worksService.assertVisible(requesterId, obraId);

    const lists = await this.prisma.materialList.findMany({
      where: { obraId },
      orderBy: { createdAt: "desc" },
    });
    return lists.map(toPublicMaterialList);
  }

  async getOne(requesterId: string, listId: string): Promise<MaterialListPublic> {
    const list = await this.getListOrThrow(listId);
    await this.worksService.assertVisible(requesterId, list.obraId);
    return toPublicMaterialList(list);
  }

  async update(
    clienteId: string,
    listId: string,
    input: UpdateMaterialListInput,
  ): Promise<MaterialListPublic> {
    const list = await this.getListOrThrow(listId);
    await this.getOwnedObraOrThrow(clienteId, list.obraId);

    const updated = await this.prisma.materialList.update({
      where: { id: listId },
      data: { itens: input.itens as unknown as Prisma.InputJsonValue },
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: list.obraId,
      acao: "material_list.updated",
      entidade: "material_list",
      payload: { materialListId: listId, quantidadeItens: input.itens.length },
    });

    return toPublicMaterialList(updated);
  }

  /** Não vaza se a lista existe — 404 se não achar. */
  private async getListOrThrow(listId: string): Promise<MaterialList> {
    const list = await this.prisma.materialList.findUnique({ where: { id: listId } });
    if (!list) {
      throw new NotFoundException("Lista de materiais não encontrada");
    }
    return list;
  }

  /** Não vaza se a obra existe e é de outro cliente — 404 nos dois casos. */
  private async getOwnedObraOrThrow(clienteId: string, obraId: string): Promise<Work> {
    const obra = await this.prisma.work.findUnique({ where: { id: obraId } });
    if (!obra || obra.clienteId !== clienteId) {
      throw new NotFoundException("Obra não encontrada");
    }
    return obra;
  }
}
