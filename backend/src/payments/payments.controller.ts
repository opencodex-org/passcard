import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { SelectPaymentCardDto } from "./dto/select-payment-card.dto";
import { PaymentsService } from "./payments.service";

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreatePaymentDto,
  ) {
    return this.paymentsService.create(request.user.userId, data);
  }

  @Get("pending")
  pending(
    @Req() request: AuthenticatedRequest,
    @Query("checkoutToken") checkoutToken?: string,
  ) {
    return this.paymentsService.findPending(request.user.userId, checkoutToken);
  }

  @Post(":paymentId/select-card")
  selectCard(
    @Req() request: AuthenticatedRequest,
    @Param("paymentId") paymentId: string,
    @Body() data: SelectPaymentCardDto,
  ) {
    return this.paymentsService.selectCard(
      request.user.userId,
      paymentId,
      data,
    );
  }

  @Post(":paymentId/confirm")
  confirm(
    @Req() request: AuthenticatedRequest,
    @Param("paymentId") paymentId: string,
    @Body() data: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirm(request.user.userId, paymentId, data);
  }

  @Get("mine")
  mine(@Req() request: AuthenticatedRequest) {
    return this.paymentsService.findMine(request.user.userId);
  }

  @Get(":paymentId")
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param("paymentId") paymentId: string,
  ) {
    return this.paymentsService.findOne(request.user.userId, paymentId);
  }
}