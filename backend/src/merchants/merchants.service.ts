import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { CreateMerchantDto } from "./dto/create-merchant.dto";
import { CreateMerchantPaymentDto } from "./dto/create-merchant-payment.dto";

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMerchantDto) {
    return this.prisma.merchant.create({ data });
  }

  async createPayment(userId: string, data: CreateMerchantPaymentDto) {
    const cashierUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!cashierUser || cashierUser.role !== "CASHIER") {
      throw new ForbiddenException("Cashier access required");
    }

    if (!Number.isInteger(data.amountMinor) || data.amountMinor <= 0) {
      throw new BadRequestException("Invalid amount");
    }

    const merchant = await this.prisma.merchant.findFirst({
      where: { id: data.merchantId, status: "ACTIVE" },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const cashier = await this.prisma.cashier.findFirst({
      where: {
        id: data.cashierId,
        merchantId: merchant.id,
        status: "ACTIVE",
      },
    });
    if (!cashier) throw new NotFoundException("Cashier not found");

    const checkoutToken = randomBytes(32).toString("base64url");
    return this.prisma.payment.create({
      data: {
        amountMinor: data.amountMinor,
        currency: "SAR",
        provider: "PASSCARD_INTERNAL_WALLET_SANDBOX",
        status: "PENDING",
        checkoutToken,
        merchantId: merchant.id,
        cashierId: cashier.id,
      },
      include: { merchant: true, cashier: true },
    });
  }
}