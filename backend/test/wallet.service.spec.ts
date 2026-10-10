import { WalletService } from "../src/wallet/wallet.service";

describe("WalletService top-up requests", () => {
  it("records a pending request without increasing the wallet balance", async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "wallet-id" }), update: jest.fn() },
      transaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: "request-id", amountMinor: 2500, status: "PENDING", type: "USER_TOPUP_REQUEST",
        }),
      },
    } as any;

    const result = await new WalletService(prisma).createTopupRequest("user-id", {
      amountMinor: 2500,
      idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
    });

    expect(result.request.status).toBe("PENDING");
    expect(result.duplicate).toBe(false);
    expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "user-id", amountMinor: 2500, status: "PENDING" }),
    }));
    expect(prisma.wallet.update).not.toHaveBeenCalled();
  });
});
