import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuditLogModule } from "../../../common/audit/audit-log.module";
import { AnalyticsModule } from "../../../common/analytics/analytics.module";
import { env } from "../../../config/env";
import { LegalModule } from "../legal/legal.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MfaService } from "./mfa.service";
import { OtpNotifier } from "./otp-notifier";
import { OtpService } from "./otp.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_TTL_SECONDS },
    }),
    AuditLogModule,
    AnalyticsModule,
    LegalModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    MfaService,
    OtpService,
    OtpNotifier,
    JwtStrategy,
  ],
  // PasswordService/TokenService reaproveitados por AccountModule (exclusão de conta, E1-08).
  exports: [PasswordService, TokenService],
})
export class AuthModule {}
