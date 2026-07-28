import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  loginInputSchema,
  mfaDisableInputSchema,
  mfaEnableInputSchema,
  mfaVerifyLoginInputSchema,
  otpRequestInputSchema,
  otpVerifyInputSchema,
  refreshInputSchema,
  registerInputSchema,
  type LoginInput,
  type MfaDisableInput,
  type MfaEnableInput,
  type MfaVerifyLoginInput,
  type OtpRequestInput,
  type OtpVerifyInput,
  type RefreshInput,
  type RegisterInput,
} from "@conectaobra/types/auth";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuthService } from "./auth.service";
import { MfaService } from "./mfa.service";
import { OtpService } from "./otp.service";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { JwtPayload } from "./strategies/jwt.strategy";
import type { RequestMeta } from "./token.service";

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly mfaService: MfaService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(
    @Body(new ZodValidationPipe(registerInputSchema)) body: RegisterInput,
    @Req() req: Request,
  ) {
    return this.authService.register(body, requestMeta(req));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(
    @Body(new ZodValidationPipe(loginInputSchema)) body: LoginInput,
    @Req() req: Request,
  ) {
    return this.authService.login(body, requestMeta(req));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  refresh(
    @Body(new ZodValidationPipe(refreshInputSchema)) body: RefreshInput,
    @Req() req: Request,
  ) {
    return this.authService.refresh(body, requestMeta(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body(new ZodValidationPipe(refreshInputSchema)) body: RefreshInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.authService.logout(body.refreshToken, user.sub);
  }

  @Post("otp/request")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async requestOtp(
    @Body(new ZodValidationPipe(otpRequestInputSchema)) body: OtpRequestInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.assertOwnPhone(user.sub, body.telefone);
    await this.otpService.request(user.sub, body.telefone);
  }

  @Post("otp/verify")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifyInputSchema)) body: OtpVerifyInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.assertOwnPhone(user.sub, body.telefone);
    await this.otpService.verify(user.sub, body.codigo);
  }

  @Post("mfa/setup")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async setupMfa(@CurrentUser() user: JwtPayload) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.sub } });
    return this.mfaService.setup(user.sub, dbUser.email);
  }

  @Post("mfa/enable")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async enableMfa(
    @Body(new ZodValidationPipe(mfaEnableInputSchema)) body: MfaEnableInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.mfaService.enable(user.sub, body.codigo);
  }

  @Post("mfa/disable")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async disableMfa(
    @Body(new ZodValidationPipe(mfaDisableInputSchema)) body: MfaDisableInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.mfaService.disable(user.sub, body.codigo);
  }

  @Post("mfa/verify-login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyMfaLogin(
    @Body(new ZodValidationPipe(mfaVerifyLoginInputSchema)) body: MfaVerifyLoginInput,
    @Req() req: Request,
  ) {
    return this.authService.completeMfaLogin(body, requestMeta(req));
  }

  private async assertOwnPhone(userId: string, telefone: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.telefone !== telefone) {
      throw new BadRequestException(
        "Telefone informado não confere com o telefone cadastrado",
      );
    }
  }
}
