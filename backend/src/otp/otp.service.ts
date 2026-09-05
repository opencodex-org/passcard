import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma.service";

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  private hashCode(code: string) {
    return createHash("sha256").update(code).digest("hex");
  }

  async send(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: "PHONE_VERIFICATION",
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return {
      success: true,
      message: "OTP generated successfully.",
      phone,
      otp: code,
    };
  }

  async verify(phone: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: "PHONE_VERIFICATION",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.codeHash !== this.hashCode(code)) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      }),
    ]);

    return {
      success: true,
      message: "Phone verified successfully.",
    };
  }
}
