import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../admin/admin.guard";
import { CreateMerchantDto } from "./dto/create-merchant.dto";
import { CreateMerchantPaymentDto } from "./dto/create-merchant-payment.dto";
import { MerchantsService } from "./merchants.service";

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller("merchants")
@UseGuards(JwtAuthGuard, AdminGuard)
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  create(@Body() data: CreateMerchantDto) {
    return this.merchantsService.create(data);
  }
}

@Controller("merchant/payments")
@UseGuards(JwtAuthGuard)
export class MerchantPaymentsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateMerchantPaymentDto,
  ) {
    return this.merchantsService.createPayment(
      request.user.userId,
      data,
    );
  }
}