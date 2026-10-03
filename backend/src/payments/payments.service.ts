import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { SelectPaymentCardDto } from "./dto/select-payment-card.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreatePaymentDto) {
    const card = await this.prisma.card.findFirst({
      where: { id: data.cardId, userId },
      include: { cardLevel: true },
    });

    if (!card) throw new NotFoundException("Card not found");
    if (card.status !== "ACTIVE") {
      throw new BadRequestException("Card is not active");
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException("Wallet not found");
    if (!Number.isInteger(data.amountMinor) || data.amountMinor <= 0) {
      throw new BadRequestException("Invalid amount");
    }
    if (wallet.balanceMinor < data.amountMinor) {
      throw new BadRequestException("Insufficient balance");
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        cardId: card.id,
        amountMinor: data.amountMinor,
        currency: "SAR",
        provider: "PASSCARD_MAX",
        status: "PENDING",
      },
      include: { card: true },
    });

    return {
      payment,
      selectedCard: payment.card,
      amount: payment.amountMinor,
      currency: payment.currency,
      status: payment.status,
      confirmationRequired: true,
      confirmationMessage: "هل أنت متأكد من الشراء؟",
    };
  }

  async confirm(userId: string, paymentId: string, data: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: { card: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status !== "PENDING") {
      throw new BadRequestException("Payment is no longer pending");
    }
    if (!payment.cardId) {
      throw new BadRequestException("Select a card before confirming payment");
    }

    if (data.confirmation === "NO") {
      const cancelled = await this.prisma.payment.updateMany({
        where: { id: paymentId, userId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      if (cancelled.count === 0) {
        throw new BadRequestException("Payment is no longer pending");
      }

      return {
        payment: { ...payment, status: "CANCELLED" },
        message: "تم إلغاء عملية الشراء.",
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, userId, status: "PENDING" },
        data: { status: "COMPLETED" },
      });

      if (claimed.count === 0) {
        throw new BadRequestException("Payment is no longer pending");
      }

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException("Wallet not found");

      const updatedWallet = await tx.wallet.updateMany({
        where: { id: wallet.id, balanceMinor: { gte: payment.amountMinor } },
        data: { balanceMinor: { decrement: payment.amountMinor } },
      });

      if (updatedWallet.count === 0) {
        throw new BadRequestException("Insufficient balance");
      }

      const providerPaymentId = `pcm_${randomUUID()}`;
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amountMinor: -payment.amountMinor,
          type: "PAYMENT",
          status: "COMPLETED",
          reference: providerPaymentId,
          description: `Payment for card ${payment.cardId}`,
        },
      });

      const completedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          providerPaymentId,
          transactionId: transaction.id,
        },
        include: { card: true },
      });

      return {
        payment: completedPayment,
        transaction,
        balanceMinor: wallet.balanceMinor - payment.amountMinor,
      };
    });
  }

  findMine(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { card: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findPending(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        status: "PENDING",
        OR: [{ userId }, { userId: null }],
      },
      include: { card: true, merchant: true, cashier: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async selectCard(
    userId: string,
    paymentId: string,
    data: SelectPaymentCardDto,
  ) {
    const card = await this.prisma.card.findFirst({
      where: { id: data.cardId, userId, status: "ACTIVE" },
    });

    if (!card) {
      throw new NotFoundException("Active card not found for user");
    }

    const selected = await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: "PENDING",
        userId: null,
        cardId: null,
      },
      data: { userId, cardId: card.id },
    });

    if (selected.count === 0) {
      throw new BadRequestException("Payment is no longer available");
    }

    return this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { card: true, merchant: true, cashier: true },
    });
  }

  async findOne(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: { card: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }
}