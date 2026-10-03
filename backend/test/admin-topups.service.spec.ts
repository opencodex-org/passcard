import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { AdminGuard } from "../src/admin/admin.guard";
import { AdminTopupsService } from "../src/admin/admin-topups.service";

const request = {
  userId: "admin-1",
  userIdTarget: "user-1",
  cardId: "card-1",
  amountMinor: 2500,
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
};

function makePrisma() {
  return {
    user: { findUnique: jest.fn() },
    card: { findMany: jest.fn(), findUnique: jest.fn() },
    wallet: { findUnique: jest.fn() },
    transaction: { findUnique: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  } as any;
}

function transactionContext(options: { ownedCard?: boolean; uniqueError?: boolean } = {}) {
  const tx = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: "user-1",
        status: "ACTIVE",
        wallet: { id: "wallet-1", balanceMinor: 1000 },
      }),
    },
    card: {
      findFirst: jest.fn().mockResolvedValue(
        options.ownedCard === false ? null : { id: "card-1" },
      ),
    },
    wallet: {
      update: jest.fn().mockResolvedValue({ balanceMinor: 3500 }),
    },
    transaction: {
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        if (options.uniqueError) {
          throw Object.assign(new Error("unique"), { code: "P2002" });
        }
        return {
          id: "transaction-1",
          adminId: data.adminId,
          userId: data.userId,
          cardId: data.cardId,
          amountMinor: data.amountMinor,
          type: data.type,
          status: data.status,
          reference: data.reference,
          createdAt: new Date("2026-01-01T00:00:00Z"),
        };
      }),
    },
  };
  return tx;
}

describe("AdminTopupsService", () => {
  it("creates one audited top-up and increases the wallet atomically", async () => {
    const prisma = makePrisma();
    const tx = transactionContext();
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" });
    prisma.transaction.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback: (value: any) => unknown) => callback(tx));

    const result = await new AdminTopupsService(prisma).create("admin-1", {
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      idempotencyKey: request.idempotencyKey,
    });

    expect(result.duplicate).toBe(false);
    expect(result.balanceMinor).toBe(3500);
    expect(result.topup).toMatchObject({
      adminId: "admin-1",
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      type: "ADMIN_TOPUP",
      status: "COMPLETED",
    });
    expect(tx.wallet.update).toHaveBeenCalledTimes(1);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
  });

  it.each(["USER", "CASHIER"]) (
    "rejects %s from creating top-ups",
    async (role) => {
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({ role, status: "ACTIVE" });

      await expect(
        new AdminTopupsService(prisma).create("non-admin", {
          userId: "user-1",
          cardId: "card-1",
          amountMinor: 100,
          idempotencyKey: request.idempotencyKey,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it("rejects non-positive or non-integer amounts", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" });

    await expect(
      new AdminTopupsService(prisma).create("admin-1", {
        userId: "user-1",
        cardId: "card-1",
        amountMinor: 0,
        idempotencyKey: request.idempotencyKey,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a card that is not owned by the selected user", async () => {
    const prisma = makePrisma();
    const tx = transactionContext({ ownedCard: false });
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" });
    prisma.transaction.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback: (value: any) => unknown) => callback(tx));

    await expect(
      new AdminTopupsService(prisma).create("admin-1", {
        userId: "user-1",
        cardId: "foreign-card",
        amountMinor: 100,
        idempotencyKey: request.idempotencyKey,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.wallet.update).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it("replays an idempotency key without increasing the wallet again", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" });
    prisma.transaction.findUnique.mockResolvedValue({
      id: "transaction-1",
      adminId: "admin-1",
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      type: "ADMIN_TOPUP",
      status: "COMPLETED",
      reference: "topup_reference",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    prisma.wallet.findUnique.mockResolvedValue({ balanceMinor: 3500 });

    const result = await new AdminTopupsService(prisma).create("admin-1", {
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      idempotencyKey: request.idempotencyKey,
    });

    expect(result.duplicate).toBe(true);
    expect(result.balanceMinor).toBe(3500);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects reusing an idempotency key with different data", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" });
    prisma.transaction.findUnique.mockResolvedValue({
      id: "transaction-1",
      adminId: "admin-1",
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      type: "ADMIN_TOPUP",
      status: "COMPLETED",
      reference: "topup_reference",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    await expect(
      new AdminTopupsService(prisma).create("admin-1", {
        userId: "user-1",
        cardId: "card-1",
        amountMinor: 500,
        idempotencyKey: request.idempotencyKey,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rolls back a concurrent duplicate before replaying it", async () => {
    const prisma = makePrisma();
    const tx = transactionContext({ uniqueError: true });
    const existing = {
      id: "transaction-1",
      adminId: "admin-1",
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      type: "ADMIN_TOPUP",
      status: "COMPLETED",
      reference: "topup_reference",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    };
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" });
    prisma.transaction.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    prisma.$transaction.mockImplementation(async (callback: (value: any) => unknown) => {
      try {
        return await callback(tx);
      } catch (error) {
        throw error;
      }
    });
    prisma.wallet.findUnique.mockResolvedValue({ balanceMinor: 3500 });

    const result = await new AdminTopupsService(prisma).create("admin-1", {
      userId: "user-1",
      cardId: "card-1",
      amountMinor: 2500,
      idempotencyKey: request.idempotencyKey,
    });

    expect(result.duplicate).toBe(true);
    expect(tx.wallet.update).toHaveBeenCalledTimes(1);
    expect(prisma.wallet.findUnique).toHaveBeenCalledTimes(1);
  });
});

describe("AdminGuard", () => {
  function contextWithRole(role?: string) {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
    } as ExecutionContext;
  }

  it("allows ADMIN", () => {
    expect(new AdminGuard().canActivate(contextWithRole("ADMIN"))).toBe(true);
  });

  it.each(["USER", "CASHIER", undefined])("blocks %s", (role) => {
    expect(() => new AdminGuard().canActivate(contextWithRole(role))).toThrow(ForbiddenException);
  });
});
