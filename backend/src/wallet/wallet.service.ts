import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { CreateTopupRequestDto } from "./dto/create-topup-request.dto";

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!wallet) throw new NotFoundException("Wallet not found");

    return {
      success: true,
      wallet: {
        id: wallet.id,
        balanceMinor: wallet.balanceMinor,
        points: wallet.points,
        transactions: wallet.transactions,
      },
    };
  }

  async createTopupRequest(userId: string, data: CreateTopupRequestDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) throw new NotFoundException("Wallet not found");
    if (!Number.isInteger(data.amountMinor) || data.amountMinor < 100) {
      throw new BadRequestException("Minimum top-up request is 1 SAR");
    }

    const existing = await this.prisma.transaction.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) return this.replayTopupRequest(existing, userId, wallet.id, data.amountMinor);

    try {
      const request = await this.prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amountMinor: data.amountMinor,
          idempotencyKey: data.idempotencyKey,
          type: "USER_TOPUP_REQUEST",
          status: "PENDING",
          description: "User requested wallet top-up; awaiting administrator review",
        },
        select: {
          id: true,
          amountMinor: true,
          status: true,
          type: true,
          createdAt: true,
        },
      });
      return { success: true, request, duplicate: false };
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      const raced = await this.prisma.transaction.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (!raced) throw error;
      return this.replayTopupRequest(raced, userId, wallet.id, data.amountMinor);
    }
  }

  getTopupRequests(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId, type: "USER_TOPUP_REQUEST" },
      select: {
        id: true,
        amountMinor: true,
        status: true,
        description: true,
        reference: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  private replayTopupRequest(
    existing: { id: string; userId: string; walletId: string; amountMinor: number; type: string; status: string; createdAt: Date },
    userId: string,
    walletId: string,
    amountMinor: number,
  ) {
    if (
      existing.type !== "USER_TOPUP_REQUEST" ||
      existing.userId !== userId ||
      existing.walletId !== walletId ||
      existing.amountMinor !== amountMinor
    ) {
      throw new ConflictException("Idempotency key was already used for another operation");
    }
    return { success: true, request: existing, duplicate: true };
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === "object" && error !== null &&
      "code" in error && (error as { code?: string }).code === "P2002";
  }
}
