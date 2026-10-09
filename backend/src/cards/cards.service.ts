import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { randomInt } from "node:crypto";

const CARD_COUNTRIES = [
  { code: "SA", name: "السعودية", currency: "SAR" },
  { code: "US", name: "الولايات المتحدة", currency: "USD" },
  { code: "GB", name: "المملكة المتحدة", currency: "GBP" },
  { code: "AE", name: "الإمارات", currency: "AED" },
  { code: "BH", name: "البحرين", currency: "BHD" },
  { code: "KW", name: "الكويت", currency: "KWD" },
  { code: "QA", name: "قطر", currency: "QAR" },
  { code: "OM", name: "عُمان", currency: "OMR" },
  { code: "EG", name: "مصر", currency: "EGP" },
  { code: "JO", name: "الأردن", currency: "JOD" },
  { code: "IN", name: "الهند", currency: "INR" },
  { code: "PK", name: "باكستان", currency: "PKR" },
  { code: "CA", name: "كندا", currency: "CAD" },
  { code: "AU", name: "أستراليا", currency: "AUD" },
  { code: "SG", name: "سنغافورة", currency: "SGD" },
  { code: "MY", name: "ماليزيا", currency: "MYR" },
  { code: "TR", name: "تركيا", currency: "TRY" },
  { code: "DE", name: "ألمانيا", currency: "EUR" },
  { code: "FR", name: "فرنسا", currency: "EUR" },
  { code: "JP", name: "اليابان", currency: "JPY" },
  { code: "CN", name: "الصين", currency: "CNY" },
  { code: "KR", name: "كوريا الجنوبية", currency: "KRW" },
  { code: "CH", name: "سويسرا", currency: "CHF" },
  { code: "NZ", name: "نيوزيلندا", currency: "NZD" },
  { code: "ZA", name: "جنوب أفريقيا", currency: "ZAR" },
] as const;

const CARD_TYPES = [
  { code: "VIRTUAL", name: "افتراضية" },
  { code: "PHYSICAL", name: "فعلية — اختيار فقط حاليًا" },
] as const;

type CreateCardInput = {
  cardLevelId: string;
  countryCode?: string;
  cardType?: string;
};

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  findOptions() {
    return {
      countries: CARD_COUNTRIES,
      cardTypes: CARD_TYPES,
    };
  }

  findLevels() {
    return this.prisma.cardLevel.findMany({
      where: { active: true },
      orderBy: [{ priceMinor: "asc" }, { name: "asc" }],
    });
  }

  async create(userId: string, input: CreateCardInput) {
    const level = await this.prisma.cardLevel.findFirst({
      where: { id: input.cardLevelId, active: true },
    });

    if (!level) {
      throw new NotFoundException("Card level not found or inactive");
    }

    const countryCode = input.countryCode ?? "SA";
    const country = CARD_COUNTRIES.find((item) => item.code === countryCode);
    if (!country) {
      throw new BadRequestException("Unsupported card country");
    }

    const cardType = input.cardType ?? "VIRTUAL";
    if (cardType !== "VIRTUAL" && cardType !== "PHYSICAL") {
      throw new BadRequestException("Unsupported card type");
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
        cardLevelId: level.id,
        cardNumber,
        ageGroup: user.ageGroup,
        countryCode: country.code,
        currency: country.currency,
        cardType,
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
