import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  presignedUploadInputSchema,
  type PresignedUploadInput,
} from "@conectaobra/types/media";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { MediaService } from "./media.service";

@Controller("media")
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("presigned-upload")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  createPresignedUpload(
    @Body(new ZodValidationPipe(presignedUploadInputSchema)) body: PresignedUploadInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mediaService.createPresignedUpload(user.sub, body);
  }
}
