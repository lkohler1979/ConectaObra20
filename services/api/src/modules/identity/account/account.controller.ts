import { Body, Controller, Delete, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { deleteAccountInputSchema, type DeleteAccountInput } from "@conectaobra/types/legal";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { AccountService } from "./account.service";

@Controller("account")
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @Body(new ZodValidationPipe(deleteAccountInputSchema)) body: DeleteAccountInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.accountService.deleteAccount(user.sub, body.senha);
  }
}
