import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub de envio de OTP por SMS — nenhum provedor foi escolhido ainda
 * (PENDENCIAS.md P-006). Loga em vez de enviar; trocar por uma integração
 * real (Zenvia/Twilio/etc.) antes de qualquer ambiente não-dev.
 */
@Injectable()
export class OtpNotifier {
  private readonly logger = new Logger(OtpNotifier.name);

  async send(telefone: string, codigo: string): Promise<void> {
    this.logger.warn(
      `[DEV-ONLY] OTP para ${telefone}: ${codigo} — nenhum provedor de SMS configurado (ver PENDENCIAS.md P-006)`,
    );
  }
}
