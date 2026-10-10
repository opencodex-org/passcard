import { BadRequestException, ConflictException } from "@nestjs/common";
import { AdminService } from "../src/admin/admin.service";

describe("AdminService card request review", () => {
  it("issues the internal card number only when an admin approves", async () => {
    const approved = {
      id: "card-request-id",
      status: "ACTIVE",
      cardNumber: "1234567890",
      cardLevel: { name: "Level One" },
    };
    const prisma = {
      card: {
        findUnique: jest.fn().mockResolvedValue({ id: "card-request-id", status: "PENDING" }),
      },
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => callback({
        card: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUniqueOrThrow: jest.fn().mockResolvedValue(approved),
        },
      })),
    } as any;

    const result = await new AdminService(prisma).reviewCardRequest(
      "card-request-id", "admin-id", { decision: "APPROVED" },
    );

    expect(result.status).toBe("ACTIVE");
    expect(result.cardNumber).toMatch(/^\d{10}$/);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("requires a reason for rejection", async () => {
    const prisma = {
      card: { findUnique: jest.fn().mockResolvedValue({ id: "card-request-id", status: "PENDING" }) },
      $transaction: jest.fn(),
    } as any;

    await expect(new AdminService(prisma).reviewCardRequest(
      "card-request-id", "admin-id", { decision: "REJECTED" },
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses a card request that was already reviewed", async () => {
    const prisma = {
      card: { findUnique: jest.fn().mockResolvedValue({ id: "card-request-id", status: "ACTIVE" }) },
      $transaction: jest.fn(),
    } as any;

    await expect(new AdminService(prisma).reviewCardRequest(
      "card-request-id", "admin-id", { decision: "APPROVED" },
    )).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
