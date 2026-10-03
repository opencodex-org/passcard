import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateCashierDto } from "./dto/create-cashier.dto";

@Injectable()
export class CashiersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCashierDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: data.merchantId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");

    return this.prisma.cashier.create({ data });
  }
}