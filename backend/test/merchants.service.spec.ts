import { ForbiddenException } from "@nestjs/common";
import { MerchantsService } from "../src/merchants/merchants.service";

describe("MerchantsService", () => {
  it("allows a CASHIER to create a pending payment", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: "CASHIER" }) },
      merchant: { findFirst: jest.fn().mockResolvedValue({ id: "merchant-1" }) },
      cashier: { findFirst: jest.fn().mockResolvedValue({ id: "cashier-1" }) },
      payment: { create: jest.fn().mockResolvedValue({ status: "PENDING", amountMinor: 500 }) },
    } as any;

    const result = await new MerchantsService(prisma).createPayment("cashier-user", {
      amountMinor: 500,
      merchantId: "merchant-1",
      cashierId: "cashier-1",
    });

    expect(result.status).toBe("PENDING");
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountMinor: 500, status: "PENDING" }) }),
    );
  });

  it("blocks a normal user from creating a merchant payment", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: "USER" }) },
      payment: { create: jest.fn() },
    } as any;

    await expect(
      new MerchantsService(prisma).createPayment("user-1", {
        amountMinor: 500,
        merchantId: "merchant-1",
        cashierId: "cashier-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
