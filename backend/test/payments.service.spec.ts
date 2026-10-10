import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PaymentsService } from "../src/payments/payments.service";

const card = { id: "card-1", userId: "user-1", status: "ACTIVE" };
const pendingPayment = {
  id: "payment-1",
  userId: "user-1",
  cardId: "card-1",
  amountMinor: 500,
  currency: "SAR",
  provider: "PASSCARD_MAX",
  status: "PENDING",
  card,
};

function paymentPrisma() {
  return {
    card: { findFirst: jest.fn() },
    wallet: { findUnique: jest.fn() },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;
}

describe("PaymentsService", () => {
  it("creates a pending payment for the user's active card", async () => {
    const prisma = paymentPrisma();
    prisma.card.findFirst.mockResolvedValue(card);
    prisma.wallet.findUnique.mockResolvedValue({ balanceMinor: 1000 });
    prisma.payment.create.mockResolvedValue(pendingPayment);

    const result = await new PaymentsService(prisma).create("user-1", {
      cardId: "card-1",
      amountMinor: 500,
    });

    expect(result.status).toBe("PENDING");
    expect(result.amount).toBe(500);
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", cardId: "card-1" }),
      }),
    );
  });

  it("does not expose unclaimed merchant payments without their checkout token", async () => {
    const prisma = paymentPrisma();
    prisma.payment.findMany.mockResolvedValue([]);

    await new PaymentsService(prisma).findPending("user-1");

    expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "PENDING", userId: "user-1" },
    }));
  });

  it("uses a private checkout token and preserves access after card selection", async () => {
    const prisma = paymentPrisma();
    prisma.payment.findFirst.mockResolvedValue(pendingPayment);

    const result = await new PaymentsService(prisma).findPending(
      "user-1", "a-valid-random-checkout-token-value-1234567890",
    );

    expect(result).toEqual([pendingPayment]);
    expect(prisma.payment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        checkoutToken: "a-valid-random-checkout-token-value-1234567890",
        status: "PENDING",
        OR: [{ userId: null }, { userId: "user-1" }],
      }),
    }));
  });

  it("rejects selecting a card owned by another user", async () => {
    const prisma = paymentPrisma();
    prisma.card.findFirst.mockResolvedValue(null);

    await expect(
      new PaymentsService(prisma).selectCard("user-1", "payment-1", {
        cardId: "foreign-card",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
  });

  it("selects an active owned card and keeps the payment pending", async () => {
    const prisma = paymentPrisma();
    prisma.card.findFirst.mockResolvedValue(card);
    prisma.payment.findFirst.mockResolvedValue(pendingPayment);
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    prisma.payment.findUniqueOrThrow.mockResolvedValue(pendingPayment);

    const result = await new PaymentsService(prisma).selectCard(
      "user-1",
      "payment-1",
      { cardId: "card-1" },
    );

    expect(result.status).toBe("PENDING");
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "user-1", cardId: "card-1" } }),
    );
  });

  it("confirms YES once, deducts the wallet, and creates one transaction", async () => {
    const prisma = paymentPrisma();
    const transaction = {
      id: "transaction-1",
      reference: "pcm-reference",
      amountMinor: -500,
      type: "PAYMENT",
      status: "COMPLETED",
    };
    const completedPayment = { ...pendingPayment, status: "COMPLETED" };
    prisma.payment.findFirst.mockResolvedValue(pendingPayment);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        payment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn().mockResolvedValue(completedPayment) },
        wallet: { findUnique: jest.fn().mockResolvedValue({ id: "wallet-1", balanceMinor: 1000 }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        transaction: { create: jest.fn().mockResolvedValue(transaction) },
      }),
    );

    const result = await new PaymentsService(prisma).confirm("user-1", "payment-1", { confirmation: "YES" });

    const completedResult = result as any;
    expect(completedResult.payment.status).toBe("COMPLETED");
    expect(completedResult.transaction.amountMinor).toBe(-500);
    expect(completedResult.balanceMinor).toBe(500);
  });

  it("cancels with NO without touching the wallet", async () => {
    const prisma = paymentPrisma();
    prisma.payment.findFirst.mockResolvedValue(pendingPayment);
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });

    const result = await new PaymentsService(prisma).confirm("user-1", "payment-1", { confirmation: "NO" });

    const cancelledResult = result as any;
    expect(cancelledResult.payment.status).toBe("CANCELLED");
    expect(cancelledResult.message).toBe("تم إلغاء عملية الشراء.");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicate confirmation after completion", async () => {
    const prisma = paymentPrisma();
    prisma.payment.findFirst.mockResolvedValue({ ...pendingPayment, status: "COMPLETED" });

    await expect(
      new PaymentsService(prisma).confirm("user-1", "payment-1", { confirmation: "YES" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects confirmation when the wallet balance is insufficient", async () => {
    const prisma = paymentPrisma();
    prisma.payment.findFirst.mockResolvedValue(pendingPayment);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        payment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        wallet: { findUnique: jest.fn().mockResolvedValue({ id: "wallet-1", balanceMinor: 100 }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        transaction: { create: jest.fn() },
      }),
    );

    await expect(
      new PaymentsService(prisma).confirm("user-1", "payment-1", { confirmation: "YES" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
