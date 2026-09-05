import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { randomInt } from "node:crypto";

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, cardLevelId: string) {
    const level = await this.prisma.cardLevel.findFirst({
      where: { id: cardLevelId, active: true },
    });

    if (!level) {
      throw new NotFoundException("Card level not found or inactive");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ageGroup: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    let cardNumber = "";

    for (let i = 0; i < 20; i++) {
      cardNumber = String(randomInt(1000000000, 10000000000));

      const exists = await this.prisma.card.findUnique({
        where: { cardNumber },
      });

      if (!exists) break;

      if (i === 19) {
        throw new BadRequestException("Unable to generate card number");
      }
    }

    return this.prisma.card.create({
      data: {
        userId,
        cardLevelId,
        cardNumber,
        ageGroup: user.ageGroup,
      },
      include: {
        cardLevel: true,
      },
    });
  }

  async findMine(userId: string) {
    return this.prisma.card.findMany({
      where: { userId },
      include: { cardLevel: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
