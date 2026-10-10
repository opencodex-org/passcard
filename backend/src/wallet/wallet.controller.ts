import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTopupRequestDto } from "./dto/create-topup-request.dto";

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Req() request: AuthenticatedRequest) {
    return this.walletService.getWallet(request.user.userId);
  }

  @Post("topup-requests")
  createTopupRequest(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateTopupRequestDto,
  ) {
    return this.walletService.createTopupRequest(request.user.userId, data);
  }

  @Get("topup-requests")
  getTopupRequests(@Req() request: AuthenticatedRequest) {
    return this.walletService.getTopupRequests(request.user.userId);
  }
}
