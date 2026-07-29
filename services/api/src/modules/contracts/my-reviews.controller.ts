import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
@UseGuards(JwtAuthGuard)
export class MyReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("received")
  listReceived(@CurrentUser() user: JwtPayload) {
    return this.reviewsService.listReceivedByMe(user.sub);
  }
}
