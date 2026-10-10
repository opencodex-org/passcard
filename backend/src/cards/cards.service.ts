import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateCardDto } from "./dto/create-card.dto";

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
    return this.findActiveLevels();
  }

  findActiveLevels() {
    return this.prisma.cardLevel.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceMinor: true,
        color: true,
        imageUrl: true,
      },
      orderBy: [{ priceMinor: "asc" }, { name: "asc" }],
    });
  }

  async create(userId: string, data: CreateCardDto) {
    const cardName = data.cardName.trim();

    if (!cardName) {
      throw new BadRequestException("Card name is required");
    }

    const level = await this.prisma.cardLevel.findFirst({
      where: { id: data.cardLevelId, active: true },
      select: { id: true },
    });

    if (!level) {
      throw new NotFoundException("Card level not found or inactive");
    }

    const countryCode = data.countryCode ?? "SA";
    const country = CARD_COUNTRIES.find(
      (item) => item.code === countryCode,
    );

    if (!country) {
      throw new BadRequestException("Unsupported card country");
    }

    const cardType = data.cardType ?? "VIRTUAL";

    if (cardType !== "VIRTUAL" && cardType !== "PHYSICAL") {
      throw new BadRequestException("Unsupported card type");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ageGroup: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new NotFoundException("Active user not found");
    }

    return this.prisma.card.create({
      data: {
        userId,
        cardLevelId: level.id,
        cardNumber: null,
        ageGroup: user.ageGroup,
        cardName,
        description: data.description?.trim() || null,
        designColor: data.designColor || "#111111",
        imageUrl: data.imageUrl || null,
        countryCode: country.code,
        currency: country.currency,
        cardType,
        status: "PENDING",
      },
      include: { cardLevel: true },
    });
  }

  findMine(userId: string) {
    return this.prisma.card.findMany({
      where: { userId },
      include: { cardLevel: true },
      orderBy: { createdAt: "desc" },
    });
  }
}