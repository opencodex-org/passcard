import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { AdminTopupDto } from "./dto/admin-topup.dto";
import { AdminReviewDto } from "./dto/admin-review.dto";
import { CreateCardLevelDto } from "./dto/create-card-level.dto";

type IdempotentTopup = {
  id: string;
  adminId: string | null;
  userId: string;
  cardId: string | null;
  amountMinor: number;
  reference: string | null;
  type: string;
  status: string;
  createdAt: Date;
};

@Injectable()
export class AdminTopupsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(search = "") {
    const term = search.trim();
    return this.prisma.user.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { phone: { contains: term } },
            ],
          }
        : undefined,
      select: { id: true, name: true, email: true, phone: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getUserCards(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const cards = await this.prisma.card.findMany({
      where: { userId },
      select: {
        id: true,
        cardNumber: true,
        status: true,
        cardLevel: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return cards.map(({ cardNumber, ...card }) => ({
      ...card,
      maskedNumber: cardNumber ? `••••${cardNumber.slice(-4)}` : "لم تصدر بعد",
    }));
  }

  async create(adminId: string, data: AdminTopupDto) {
    await this.assertAdmin(adminId);
    this.validateAmount(data.amountMinor);

    const previous = await this.findByIdempotencyKey(data.idempotencyKey);
    if (previous) return this.replay(previous, adminId, data);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: data.userId },
          select: {
            id: true,
            status: true,
            wallet: { select: { id: true, balanceMinor: true } },
          },
        });
        if (!target || target.status !== "ACTIVE") {
          throw new NotFoundException("Active user not found");
        }
        if (!target.wallet) throw new NotFoundException("Wallet not found");

        let card: { id: string } | null = null;
        if (data.cardId) {
          card = await tx.card.findFirst({
            where: { id: data.cardId, userId: target.id, status: "ACTIVE" },
            select: { id: true },
          });
          if (!card) throw new NotFoundException("Active user card not found");
        }

        const updatedWallet = await tx.wallet.update({
          where: { id: target.wallet.id },
          data: { balanceMinor: { increment: data.amountMinor } },
          select: { balanceMinor: true },
        });

        const transaction = await tx.transaction.create({
          data: {
            userId: target.id,
            walletId: target.wallet.id,
            adminId,
            cardId: card?.id ?? null,
            idempotencyKey: data.idempotencyKey,
            amountMinor: data.amountMinor,
            type: "ADMIN_TOPUP",
            status: "COMPLETED",
            reference: `topup_${randomUUID()}`,
            description: "Wallet top-up by administrator",
          },
          select: {
            id: true,
            adminId: true,
            userId: true,
            cardId: true,
            amountMinor: true,
            type: true,
            status: true,
            reference: true,
            createdAt: true,
          },
        });

        return {
          topup: transaction,
          balanceMinor: updatedWallet.balanceMinor,
          duplicate: false,
        };
      });
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;

      const concurrent = await this.findByIdempotencyKey(data.idempotencyKey);
      if (!concurrent) throw error;
      return this.replay(concurrent, adminId, data);
    }
  }

  async listTopupRequests() {
    return this.prisma.transaction.findMany({
      where: { type: "USER_TOPUP_REQUEST", status: "PENDING" },
      select: {
        id: true,
        userId: true,
        amountMinor: true,
        status: true,
        description: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  async reviewTopupRequest(
    adminId: string,
    requestId: string,
    data: AdminReviewDto,
  ) {
    await this.assertAdmin(adminId);
    const reason = data.reason?.trim() || null;
    if (data.decision === "REJECTED" && !reason) {
      throw new BadRequestException("A reason is required to reject a top-up request");
    }

    if (data.decision === "REJECTED") {
      const updated = await this.prisma.transaction.updateMany({
        where: { id: requestId, type: "USER_TOPUP_REQUEST", status: "PENDING" },
        data: {
          status: "REJECTED",
          adminId,
          description: reason || "Top-up request rejected by administrator",
        },
      });
      if (updated.count !== 1) {
        const existing = await this.prisma.transaction.findFirst({
          where: { id: requestId, type: "USER_TOPUP_REQUEST" },
          select: { id: true },
        });
        if (!existing) throw new NotFoundException("Top-up request not found");
        throw new ConflictException("Top-up request was already reviewed");
      }
      return this.prisma.transaction.findUniqueOrThrow({ where: { id: requestId } });
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.transaction.findFirst({
        where: { id: requestId, type: "USER_TOPUP_REQUEST", status: "PENDING" },
        select: { id: true, userId: true, walletId: true, amountMinor: true },
      });
      if (!request) {
        const existing = await tx.transaction.findFirst({
          where: { id: requestId, type: "USER_TOPUP_REQUEST" },
          select: { id: true },
        });
        if (!existing) throw new NotFoundException("Top-up request not found");
        throw new ConflictException("Top-up request was already reviewed");
      }

      const claimed = await tx.transaction.updateMany({
        where: { id: requestId, type: "USER_TOPUP_REQUEST", status: "PENDING" },
        data: {
          status: "COMPLETED",
          adminId,
          reference: `approved_topup_${randomUUID()}`,
          description: reason || "Top-up request approved by administrator",
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException("Top-up request was already reviewed");
      }

      const wallet = await tx.wallet.update({
        where: { id: request.walletId },
        data: { balanceMinor: { increment: request.amountMinor } },
        select: { balanceMinor: true },
      });
      const transaction = await tx.transaction.findUniqueOrThrow({
        where: { id: requestId },
      });
      return {
        success: true,
        request: transaction,
        balanceMinor: wallet.balanceMinor,
      };
    });
  }

  listCardLevels() {
    return this.prisma.cardLevel.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async createCardLevel(data: CreateCardLevelDto) {
    const name = data.name.trim();
    if (!name) throw new BadRequestException("Card level name is required");
    try {
      return await this.prisma.cardLevel.create({
        data: {
          name,
          description: data.description?.trim() || null,
          priceMinor: data.priceMinor,
          color: data.color || "#111111",
          imageUrl: data.imageUrl || null,
          active: true,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("A card level with this name already exists");
      }
      throw error;
    }
  }

  async list() {
    const entries = await this.prisma.transaction.findMany({
      where: { type: "ADMIN_TOPUP" },
      select: {
        id: true,
        adminId: true,
        userId: true,
        cardId: true,
        amountMinor: true,
        status: true,
        reference: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } },
        card: { select: { cardNumber: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return entries.map(({ card, ...entry }) => ({
      ...entry,
      card: card
        ? { maskedNumber: card.cardNumber ? `••••${card.cardNumber.slice(-4)}` : "لم تصدر بعد", status: card.status }
        : null,
    }));
  }

  private async assertAdmin(adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, status: true },
    });
    if (!admin || admin.role !== "ADMIN" || admin.status !== "ACTIVE") {
      throw new ForbiddenException("Admin access required");
    }
  }

  private validateAmount(amountMinor: number) {
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new BadRequestException("Top-up amount must be a positive integer in minor units");
    }
  }

  private async findByIdempotencyKey(key: string): Promise<IdempotentTopup | null> {
    return this.prisma.transaction.findUnique({
      where: { idempotencyKey: key },
      select: {
        id: true,
        adminId: true,
        userId: true,
        cardId: true,
        amountMinor: true,
        reference: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });
  }

  private async replay(
    existing: IdempotentTopup,
    adminId: string,
    data: AdminTopupDto,
  ) {
    if (
      existing.type !== "ADMIN_TOPUP" ||
      existing.adminId !== adminId ||
      existing.userId !== data.userId ||
      existing.cardId !== (data.cardId ?? null) ||
      existing.amountMinor !== data.amountMinor
    ) {
      throw new ConflictException("Idempotency key was already used for another top-up");
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: data.userId },
      select: { balanceMinor: true },
    });
    if (!wallet) throw new NotFoundException("Wallet not found");

    return {
      topup: existing,
      balanceMinor: wallet.balanceMinor,
      duplicate: true,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }
}