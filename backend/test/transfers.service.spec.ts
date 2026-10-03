import { BadRequestException } from "@nestjs/common";
import { TransfersService } from "../src/transfers/transfers.service";

describe("TransfersService", () => {
  it("rejects a transfer if the balance changed before the atomic debit", async () => {
    const walletUpdate = jest.fn();
    const transactionCreateMany = jest.fn();
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "recipient-1",
          email: "recipient@example.com",
          wallet: { id: "recipient-wallet" },
        }),
      },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sender-wallet",
          balanceMinor: 500,
        }),
      },
      $transaction: jest.fn((callback) =>
        callback({
          wallet: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            update: walletUpdate,
          },
          transaction: { createMany: transactionCreateMany },
        }),
      ),
    } as any;

    await expect(
      new TransfersService(prisma).transfer("sender-1", "recipient@example.com", 500),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(walletUpdate).not.toHaveBeenCalled();
    expect(transactionCreateMany).not.toHaveBeenCalled();
  });
});