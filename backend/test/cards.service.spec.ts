import { NotFoundException } from "@nestjs/common";
import { CardsService } from "../src/cards/cards.service";

describe("CardsService", () => {
  it("creates a pending card request bound to the authenticated user", async () => {
    const created = {
      id: "card-request-id",
      userId: "user-id",
      cardLevelId: "level-id",
      cardNumber: null,
      status: "PENDING",
      cardName: "My PassCard",
      designColor: "#112233",
      cardLevel: { id: "level-id", name: "Level One" },
    };
    const prisma = {
      cardLevel: { findFirst: jest.fn().mockResolvedValue({ id: "level-id" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ ageGroup: "ADULT", status: "ACTIVE" }) },
      card: { create: jest.fn().mockResolvedValue(created) },
    } as any;
    const service = new CardsService(prisma);

    const result = await service.create("user-id", {
      cardLevelId: "level-id",
      cardName: " My PassCard ",
      designColor: "#112233",
    });

    expect(result.status).toBe("PENDING");
    expect(result.cardNumber).toBeNull();
    expect(prisma.card.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-id",
        cardLevelId: "level-id",
        cardName: "My PassCard",
        status: "PENDING",
        cardNumber: null,
      }),
    }));
  });

  it("refuses inactive or unknown card levels", async () => {
    const prisma = {
      cardLevel: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findUnique: jest.fn() },
      card: { create: jest.fn() },
    } as any;
    await expect(new CardsService(prisma).create("user-id", {
      cardLevelId: "level-id", cardName: "My Card",
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.card.create).not.toHaveBeenCalled();
  });
});
