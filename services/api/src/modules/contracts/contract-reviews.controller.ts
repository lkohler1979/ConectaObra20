import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { createReviewInputSchema, type CreateReviewInput } from "@conectaobra/types/reviews";
import { contractIdSchema } from "@conectaobra/types/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { ReviewsService } from "./reviews.service";

@Controller("contracts/:contractId/reviews")
@UseGuards(JwtAuthGuard)
export class ContractReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @Body(new ZodValidationPipe(createReviewInputSchema)) body: CreateReviewInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.create(contractId, user.sub, body);
  }

  @Get()
  list(
    @Param("contractId", new ZodValidationPipe(contractIdSchema)) contractId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.listForContract(contractId, user.sub);
  }
}
