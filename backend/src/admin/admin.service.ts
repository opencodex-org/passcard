import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { AdminReviewDto } from "./dto/admin-review.dto";
import { AdminUserActionDto } from "./dto/admin-user-action.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [pendingCardRequests, pendingVerifications, users, childrenAccounts] =
      await Promise.all([
        this.prisma.card.count({ where: { status: "PENDING" } }),
        this.prisma.verification.count({ where: { status: "PENDING" } }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { ageGroup: "KIDS" } }),
      ]);

    return {
      success: true,
      pendingCardRequests,
      pendingVerifications,
      users,
      childrenAccounts,
      status: "operational",
    };
  }

  listPendingCardRequests() {
    return this.prisma.card.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        cardLevel: { select: { id: true, name: true, priceMinor: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  async reviewCardRequest(
    requestId: string,
    adminId: string,
    data: AdminReviewDto,
  ) {
    if (!requestId) throw new NotFoundException("Card request not found");
    const request = await this.prisma.card.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException("Card request not found");
    if (request.status !== "PENDING") {
      throw new ConflictException("Card request was already reviewed");
    }

    const reason = data.reason?.trim() || null;
    if (data.decision === "REJECTED" && !reason) {
      throw new BadRequestException("A reason is required to reject a card request");
    }

    const reviewedAt = new Date();
    if (data.decision === "REJECTED") {
      const result = await this.prisma.card.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "REJECTED",
          reviewedAt,
          reviewedById: adminId,
          reviewReason: reason,
        },
      });
      if (result.count !== 1) {
        throw new ConflictException("Card request was already reviewed");
      }
      return this.prisma.card.findUniqueOrThrow({
        where: { id: requestId },
        include: { cardLevel: true },
      });
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const cardNumber = String(randomInt(1_000_000_000, 10_000_000_000));
      try {
        return await this.prisma.$transaction(async (tx) => {
          const result = await tx.card.updateMany({
            where: { id: requestId, status: "PENDING" },
            data: {
              status: "ACTIVE",
              cardNumber,
              reviewedAt,
              reviewedById: adminId,
              reviewReason: reason,
            },
          });
          if (result.count !== 1) {
            throw new ConflictException("Card request was already reviewed");
          }
          return tx.card.findUniqueOrThrow({
            where: { id: requestId },
            include: { cardLevel: true },
          });
        });
      } catch (error) {
        if (this.isUniqueViolation(error)) continue;
        throw error;
      }
    }

    throw new BadRequestException("Unable to issue a unique internal card number");
  }

  async userAction(userId: string, adminId: string, data: AdminUserActionDto) {
    if (!userId) throw new NotFoundException("User not found");
    if (userId === adminId && data.action !== "UNSUSPEND") {
      throw new BadRequestException("Administrators cannot suspend or disable themselves");
    }

    const status = data.action === "UNSUSPEND"
      ? "ACTIVE"
      : data.action === "SUSPEND"
        ? "SUSPENDED"
        : "DISABLED";

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { status },
        select: { id: true, name: true, email: true, status: true, updatedAt: true },
      });
      return {
        success: true,
        userId: user.id,
        action: data.action,
        reason: data.reason?.trim() || null,
        status: user.status,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (this.isMissingRecord(error)) throw new NotFoundException("User not found");
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === "object" && error !== null &&
      "code" in error && (error as { code?: string }).code === "P2002";
  }

  private isMissingRecord(error: unknown): boolean {
    return typeof error === "object" && error !== null &&
      "code" in error && (error as { code?: string }).code === "P2025";
  }
}
