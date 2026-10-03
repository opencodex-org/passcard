import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { SmsVerificationService } from "./sms-verification.service";

const PHONE_OTP_PURPOSE = "PHONE_VERIFICATION";
const PHONE_OTP_TTL_MS = 10 * 60 * 1000;
const PHONE_OTP_RESEND_DELAY_MS = 60 * 1000;
const PHONE_OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsVerification: SmsVerificationService,
  ) {}

  private normalizePhone(phone: string) {
    if (/^05\d{8}$/.test(phone)) {
      return { local: phone, e164: `+966${phone.slice(1)}` };
    }
    if (/^\+9665\d{8}$/.test(phone)) {
      return { local: `0${phone.slice(4)}`, e164: phone };
    }

    throw new BadRequestException("Enter a valid Saudi mobile number");
  }

  async send(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone.local },
          { phone: normalizedPhone.e164 },
        ],
      },
      select: { id: true, phoneVerified: true },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }
    if (user.phoneVerified) {
      throw new ConflictException("Phone is already verified");
    }

    const latest = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, purpose: PHONE_OTP_PURPOSE },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < PHONE_OTP_RESEND_DELAY_MS
    ) {
      throw new HttpException(
        "Wait before requesting another code",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const challenge = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.otpCode.updateMany({
        where: { userId: user.id, purpose: PHONE_OTP_PURPOSE, usedAt: null },
        data: { usedAt: now },
      });
      return tx.otpCode.create({
        data: {
          userId: user.id,
          purpose: PHONE_OTP_PURPOSE,
          codeHash: createHash("sha256")
            .update(randomBytes(32))
            .digest("hex"),
          expiresAt: new Date(Date.now() + PHONE_OTP_TTL_MS),
        },
        select: { id: true },
      });
    });

    try {
      await this.smsVerification.send(normalizedPhone.e164);
    } catch (error) {
      await this.prisma.otpCode.updateMany({
        where: { id: challenge.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        "Phone verification is temporarily unavailable",
      );
    }

    return {
      success: true,
      message: "A phone verification code has been sent.",
    };
  }

  async verify(phone: string, code: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone.local },
          { phone: normalizedPhone.e164 },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }
    if (user.phoneVerified) {
      throw new ConflictException("Phone is already verified");
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: PHONE_OTP_PURPOSE,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: PHONE_OTP_MAX_ATTEMPTS },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    const valid = await this.smsVerification.verify(normalizedPhone.e164, code);
    if (!valid) {
      await this.prisma.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: PHONE_OTP_MAX_ATTEMPTS },
        },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: PHONE_OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException("Invalid or expired OTP");
      }
      await tx.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    });

    return {
      success: true,
      message: "Phone verified successfully.",
    };
  }
}
