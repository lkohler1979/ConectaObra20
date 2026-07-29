import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AddTeamMemberInput, TeamMemberPublic } from "@conectaobra/types/equipe";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { WorksService } from "./works.service";
import { toPublicTeamMember } from "./work-team-public.mapper";

const MEMBER_SELECT = {
  user: { select: { nome: true, email: true, tipo: true } },
} satisfies Prisma.WorkTeamMemberInclude;

@Injectable()
export class WorkTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly worksService: WorksService,
  ) {}

  /** Adicionar membro (E6-04) — exclusivo do dono da obra. */
  async add(
    clienteId: string,
    workId: string,
    input: AddTeamMemberInput,
  ): Promise<TeamMemberPublic> {
    const work = await this.getOwnedOrThrow(clienteId, workId);

    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.deletedAt) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (user.id === clienteId) {
      throw new ConflictException("Você já é o dono desta obra");
    }

    let member;
    try {
      member = await this.prisma.workTeamMember.create({
        data: { obraId: work.id, userId: user.id, addedById: clienteId },
        include: MEMBER_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Este usuário já faz parte da equipe desta obra");
      }
      throw error;
    }

    await this.auditLog.record({
      userId: clienteId,
      obraId: work.id,
      acao: "work_team_member.added",
      entidade: "work_team_member",
      payload: { memberUserId: user.id },
    });

    return toPublicTeamMember(member);
  }

  /** Listar equipe (E6-04) — dono ou membro (só leitura). */
  async list(requesterId: string, workId: string): Promise<TeamMemberPublic[]> {
    await this.worksService.assertVisible(requesterId, workId);

    const members = await this.prisma.workTeamMember.findMany({
      where: { obraId: workId },
      orderBy: { createdAt: "asc" },
      include: MEMBER_SELECT,
    });

    return members.map(toPublicTeamMember);
  }

  /** Remover membro (E6-04) — exclusivo do dono da obra. */
  async remove(clienteId: string, workId: string, memberUserId: string): Promise<void> {
    const work = await this.getOwnedOrThrow(clienteId, workId);

    const { count } = await this.prisma.workTeamMember.deleteMany({
      where: { obraId: work.id, userId: memberUserId },
    });
    if (count === 0) {
      throw new NotFoundException("Membro não encontrado na equipe desta obra");
    }

    await this.auditLog.record({
      userId: clienteId,
      obraId: work.id,
      acao: "work_team_member.removed",
      entidade: "work_team_member",
      payload: { memberUserId },
    });
  }

  /** Não vaza se a obra existe e é de outro cliente — 404 nos dois casos. */
  private async getOwnedOrThrow(clienteId: string, workId: string) {
    const work = await this.prisma.work.findUnique({ where: { id: workId } });
    if (!work || work.clienteId !== clienteId) {
      throw new NotFoundException("Obra não encontrada");
    }
    return work;
  }
}
