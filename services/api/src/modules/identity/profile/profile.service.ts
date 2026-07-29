import { Injectable } from "@nestjs/common";
import type {
  FornecedorProfileInput,
  PrestadorProfileInput,
} from "@conectaobra/types/profile";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { MeilisearchService } from "../../search/meilisearch.service";
import { toPublicUser } from "../auth/user-public.mapper";

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profilePrestador: true, profileFornecedor: true },
    });

    return {
      ...toPublicUser(user),
      profilePrestador: user.profilePrestador ?? null,
      profileFornecedor: user.profileFornecedor ?? null,
    };
  }

  async upsertPrestador(userId: string, input: PrestadorProfileInput) {
    const data = {
      categorias: input.categorias,
      experienciaAnos: input.experienciaAnos,
      certificados: input.certificados,
      raioAtendimentoKm: input.raioAtendimentoKm,
    };

    await this.prisma.profilePrestador.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // Unsupported("geography") não é gravável pelo client — usa PostGIS via raw SQL.
    if (input.geo) {
      await this.prisma.$executeRaw`
        UPDATE profiles_prestador
        SET geo = ST_SetSRID(ST_MakePoint(${input.geo.lng}, ${input.geo.lat}), 4326)::geography
        WHERE user_id = ${userId}::uuid
      `;
    }

    await this.auditLog.record({
      userId,
      acao: "profile.prestador_updated",
      entidade: "profiles_prestador",
      payload: { categorias: input.categorias, temGeo: Boolean(input.geo) },
    });

    const me = await this.getMe(userId);
    await this.meilisearch.indexPrestador({
      userId,
      nome: me.nome,
      categorias: me.profilePrestador?.categorias ?? [],
      experienciaAnos: me.profilePrestador?.experienciaAnos ?? null,
      raioAtendimentoKm: me.profilePrestador?.raioAtendimentoKm ?? null,
      selo: me.profilePrestador?.selo ?? null,
      notaMedia: me.profilePrestador?.notaMedia ? me.profilePrestador.notaMedia.toNumber() : null,
    });
    return me;
  }

  async upsertFornecedor(userId: string, input: FornecedorProfileInput) {
    await this.prisma.profileFornecedor.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });

    await this.auditLog.record({
      userId,
      acao: "profile.fornecedor_updated",
      entidade: "profiles_fornecedor",
      payload: { razaoSocial: input.razaoSocial },
    });

    const me = await this.getMe(userId);
    await this.meilisearch.indexFornecedor({
      userId,
      razaoSocial: me.profileFornecedor?.razaoSocial ?? "",
      categorias: me.profileFornecedor?.categorias ?? [],
      regioes: me.profileFornecedor?.regioes ?? [],
      tempoMercadoAnos: me.profileFornecedor?.tempoMercadoAnos ?? null,
      selo: me.profileFornecedor?.selo ?? null,
      notaMedia: me.profileFornecedor?.notaMedia ? me.profileFornecedor.notaMedia.toNumber() : null,
    });
    return me;
  }
}
