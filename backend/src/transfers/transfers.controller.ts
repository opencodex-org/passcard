import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { TransfersService } from "./transfers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("transfers")
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  transfer(
    @Req() req: any,
    @Body() body: { recipientEmail: string; amountMinor: number },
  ) {
    return this.transfersService.transfer(
      req.user.userId,
      body.recipientEmail,
      body.amountMinor,
    );
  }
}
