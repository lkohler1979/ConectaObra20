import { createHash, randomInt } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { env } from "../../../config/env";
import { OtpNotifier } from "./otp-notifier";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Verificação de telefone por código de 6 dígitos (E1-01). O código nunca é
 * armazenado em claro; `tentativas` limita brute-force (OTP_MAX_ATTEMPTS).
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: OtpNotifier,
  ) {}

  async request(userId: string, telefone: string): Promise<void> {
    const codigo = generateCode();
    await this.prisma.otpCode.create({
      data: {
        userId,
        codeHash: sha256(codigo),
        expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000),
      },
    });
    await this.notifier.send(telefone, codigo);
  }

  async verify(userId: string, codigo: string): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new BadRequestException("Nenhum código pendente. Solicite um novo.");
    }
    if (otp.expiresAt < new Date()) {
      throw new BadRequestException("Código expirado. Solicite um novo.");
    }
    if (otp.tentativas >= env.OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        "Número máximo de tentativas excedido. Solicite um novo código.",
      );
    }

    if (sha256(codigo) !== otp.codeHash) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { tentativas: { increment: 1 } },
      });
      throw new BadRequestException("Código inválido");
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { telefoneVerificado: true },
      }),
    ]);
  }
}
