import { randomUUID } from "node:crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateSurplusListingInput,
  SurplusCheckoutInput,
  SurplusListingOwner,
  SurplusListingPublic,
  SurplusOrderPublic,
  UpdateSurplusListingInput,
} from "@conectaobra/types/material-surplus";
import { env } from "../../config/env";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import {
  toOwnerSurplusListing,
  toPublicSurplusListing,
  toPublicSurplusOrder,
} from "./surplus-listing-public.mapper";

const WITH_CLIENTE = { cliente: { select: { nome: true } } } satisfies Prisma.SurplusListingInclude;
const WITH_CLIENTE_AND_ORDER = {
  cliente: { select: { nome: true } },
  order: true,
} satisfies Prisma.SurplusListingInclude;

/**
 * Marketplace público de sobra de material — cliente dono de uma obra
 * anuncia material excedente, qualquer pessoa do público compra via
 * checkout de convidado. Checkout segue o mesmo padrão do PurchaseOrder
 * (E7-04): PSP SIMULADO, sempre sucesso, comissão em basis points,
 * idempotente via @unique em surplusListingId.
 */
@Injectable()
export class SurplusListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(clienteId: string, input: CreateSurplusListingInput): Promise<SurplusListingPublic> {
    const obra = await this.prisma.work.findUnique({ where: { id: input.workId } });
    if (!obra || obra.clienteId !== clienteId) {
      throw new NotFoundException("Obra não encontrada");
    }

    const listing = await this.prisma.surplusListing.create({
      data: {
        workId: input.workId,
        clienteId,
        nome: input.nome,
        descricao: input.descricao,
        categoria: input.categoria,
        quantidade: input.quantidade,
        unidade: input.unidade,
        precoCentavos: input.precoCentavos,
        fotos: input.fotos,
      },
      include: WITH_CLIENTE,
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: input.workId,
      acao: "surplus_listing.created",
      entidade: "surplus_listing",
      payload: { surplusListingId: listing.id, precoCentavos: listing.precoCentavos },
    });

    return toPublicSurplusListing(listing);
  }

  async listMine(clienteId: string, workId?: string): Promise<SurplusListingOwner[]> {
    const listings = await this.prisma.surplusListing.findMany({
      where: { clienteId, ...(workId ? { workId } : {}) },
      orderBy: { createdAt: "desc" },
      include: WITH_CLIENTE_AND_ORDER,
    });
    return listings.map(toOwnerSurplusListing);
  }

  async updateStatus(
    clienteId: string,
    id: string,
    input: UpdateSurplusListingInput,
  ): Promise<SurplusListingPublic> {
    const listing = await this.prisma.surplusListing.findUnique({ where: { id } });
    if (!listing || listing.clienteId !== clienteId) {
      throw new NotFoundException("Anúncio não encontrado");
    }

    const updated = await this.prisma.surplusListing.update({
      where: { id },
      data: { status: input.status },
      include: WITH_CLIENTE,
    });
    return toPublicSurplusListing(updated);
  }

  async listPublic(filters: { categoria?: string; q?: string }): Promise<SurplusListingPublic[]> {
    const listings = await this.prisma.surplusListing.findMany({
      where: {
        status: "DISPONIVEL",
        ...(filters.categoria ? { categoria: filters.categoria } : {}),
        ...(filters.q
          ? { nome: { contains: filters.q, mode: Prisma.QueryMode.insensitive } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: WITH_CLIENTE,
    });
    return listings.map(toPublicSurplusListing);
  }

  async getPublic(id: string): Promise<SurplusListingPublic> {
    const listing = await this.prisma.surplusListing.findUnique({
      where: { id },
      include: WITH_CLIENTE,
    });
    if (!listing || listing.status !== "DISPONIVEL") {
      throw new NotFoundException("Anúncio não encontrado");
    }
    return toPublicSurplusListing(listing);
  }

  async checkout(listingId: string, input: SurplusCheckoutInput): Promise<SurplusOrderPublic> {
    const listing = await this.prisma.surplusListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "DISPONIVEL") {
      throw new NotFoundException("Anúncio não encontrado");
    }

    const comissaoCentavos = Math.round(
      (listing.precoCentavos * env.SURPLUS_COMMISSION_BPS) / 10_000,
    );
    const totalPagoCentavos = listing.precoCentavos + comissaoCentavos;
    const pspRef = `SIMULADO-${randomUUID()}`;

    let order;
    try {
      order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.surplusOrder.create({
          data: {
            surplusListingId: listingId,
            compradorNome: input.compradorNome,
            compradorEmail: input.compradorEmail,
            compradorTelefone: input.compradorTelefone,
            itemPrecoCentavos: listing.precoCentavos,
            comissaoCentavos,
            totalPagoCentavos,
            pspRef,
            status: "PAGO",
          },
        });
        await tx.surplusListing.update({ where: { id: listingId }, data: { status: "VENDIDO" } });
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Este item já foi vendido");
      }
      throw error;
    }

    await this.auditLog.record({
      userId: listing.clienteId,
      obraId: listing.workId,
      acao: "surplus_order.created",
      entidade: "surplus_order",
      payload: { surplusListingId: listingId, totalPagoCentavos, pspRef, simulado: true },
    });

    return toPublicSurplusOrder(order);
  }
}
