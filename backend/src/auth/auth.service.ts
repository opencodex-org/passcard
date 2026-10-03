import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  createHash,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { getJwtSecret } from "./jwt-secret";
import { EmailDto } from "./dto/email.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { EmailService } from "./email.service";

const scryptAsync = promisify(scrypt);
const EMAIL_OTP_PURPOSE = "EMAIL_VERIFICATION";
const EMAIL_OTP_TTL_MS = 5 * 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_RESEND_DELAY_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private isEmailVerificationEnabled(): boolean {
    return process.env.EMAIL_VERIFICATION_ENABLED === "true";
  }

  private assertEmailVerificationEnabled(): void {
    if (!this.isEmailVerificationEnabled()) {
      throw new NotFoundException("Email verification is disabled");
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();

    let age = today.getFullYear() - dateOfBirth.getFullYear();

    const month = today.getMonth() - dateOfBirth.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    return age;
  }

  private getAgeGroup(age: number): string {
    if (age >= 0 && age <= 17) {
      return "KIDS";
    }

    if (age >= 18 && age <= 40) {
      return "ADULT";
    }

    if (age >= 41 && age <= 150) {
      return "SENIOR";
    }

    throw new BadRequestException("Invalid date of birth");
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");

    const derivedKey = (await scryptAsync(
      password,
      salt,
      64,
    )) as Buffer;

    return `${salt}:${derivedKey.toString("hex")}`;
  }

  private async verifyPassword(
    password: string,
    storedPassword: string,
  ): Promise<boolean> {
    const [salt, storedKey] = storedPassword.split(":");

    if (!salt || !storedKey) {
      return false;
    }

    const derivedKey = (await scryptAsync(
      password,
      salt,
      64,
    )) as Buffer;

    const storedKeyBuffer = Buffer.from(storedKey, "hex");

    if (derivedKey.length !== storedKeyBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKeyBuffer);
  }

  private hashEmailCode(code: string) {
    return createHash("sha256").update(code).digest("hex");
  }

  private async generateEmailVerificationCode(userId: string): Promise<string> {
    const now = new Date();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = String(randomInt(100000, 1000000));
      const existingCode = await this.prisma.otpCode.findFirst({
        where: {
          userId,
          purpose: EMAIL_OTP_PURPOSE,
          codeHash: this.hashEmailCode(code),
          createdAt: { gt: new Date(now.getTime() - EMAIL_OTP_TTL_MS) },
        },
        select: { id: true },
      });

      if (!existingCode) return code;
    }

    throw new ServiceUnavailableException(
      "Unable to generate a unique email verification code",
    );
  }

  private async createEmailVerificationCode(
    userId: string,
    email: string,
  ): Promise<void> {
    const code = await this.generateEmailVerificationCode(userId);
    const otp = await this.prisma.otpCode.create({
      data: {
        userId,
        purpose: EMAIL_OTP_PURPOSE,
        codeHash: this.hashEmailCode(code),
        expiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS),
      },
      select: { id: true },
    });

    try {
      await this.emailService.sendVerificationCode(email, code);
    } catch (error) {
      await this.prisma.otpCode.updateMany({
        where: { id: otp.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      throw error;
    }

  }

  private createSession(user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    ageGroup: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    wallet?: { balanceMinor: number; points: number } | null;
    _count?: { cards: number };
  }) {
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    return {
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        ageGroup: user.ageGroup,
        role: user.role,
      },
      wallet: {
        balanceMinor: user.wallet?.balanceMinor ?? 0,
        points: user.wallet?.points ?? 0,
      },
      cards: { count: user._count?.cards ?? 0 },
      security: {
        authenticated: true,
        emailVerified: user.emailVerified || !this.isEmailVerificationEnabled(),
        phoneVerified: user.phoneVerified,
        identityVerified: user.identityVerified,
      },
    };
  }

  async register(data: RegisterDto) {
    const emailVerificationEnabled = this.isEmailVerificationEnabled();
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim();

    if (!name) {
      throw new BadRequestException("Name is required");
    }

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    if (!phone) {
      throw new BadRequestException("Phone is required");
    }

    if (!data.password || data.password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters",
      );
    }

    if (emailVerificationEnabled && !this.emailService.isConfigured()) {
      throw new BadRequestException(
        "Email verification is not configured",
      );
    }

    const dateOfBirth = new Date(data.dateOfBirth);

    if (Number.isNaN(dateOfBirth.getTime())) {
      throw new BadRequestException("Invalid date of birth");
    }

    if (dateOfBirth > new Date()) {
      throw new BadRequestException(
        "Date of birth cannot be in the future",
      );
    }

    const age = this.calculateAge(dateOfBirth);
    const ageGroup = this.getAgeGroup(age);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException("Email is already registered");
      }

      throw new ConflictException("Phone is already registered");
    }

    const passwordHash = await this.hashPassword(data.password);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          dateOfBirth,
          ageGroup,
          wallet: {
            create: {
              balanceMinor: 0,
              points: 0,
            },
          },
        },
        include: {
          wallet: true,
          _count: {
            select: {
              cards: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        throw new ConflictException("Email or phone is already registered");
      }
      throw error;
    }

    if (emailVerificationEnabled) {
      await this.createEmailVerificationCode(user.id, user.email);
    }
    const session = emailVerificationEnabled ? null : this.createSession(user);

    return {
      ...session,
      success: true,
      message: emailVerificationEnabled
        ? "Account created. Verify your email to continue."
        : "Account created successfully.",
      emailVerificationRequired: emailVerificationEnabled,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        age: age,
        ageGroup: user.ageGroup,
        role: user.role,
      },
      wallet: {
        balanceMinor: user.wallet?.balanceMinor ?? 0,
        points: user.wallet?.points ?? 0,
      },
      cards: {
        count: user._count.cards,
      },
      security: {
        emailVerified: user.emailVerified || !emailVerificationEnabled,
        phoneVerified: user.phoneVerified,
        identityVerified: user.identityVerified,
      },
    };
  }

  async login(data: LoginDto) {
    const email = data.email?.trim().toLowerCase();

    if (!email || !data.password) {
      throw new BadRequestException(
        "Email and password are required",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true,
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("EMAIL_NOT_REGISTERED");
    }

    const passwordValid = await this.verifyPassword(
      data.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is inactive");
    }

    if (this.isEmailVerificationEnabled() && !user.emailVerified) {
      const now = new Date();
      const latestOtp = await this.prisma.otpCode.findFirst({
        where: { userId: user.id, purpose: EMAIL_OTP_PURPOSE },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      const activeOtp = await this.prisma.otpCode.findFirst({
        where: {
          userId: user.id,
          purpose: EMAIL_OTP_PURPOSE,
          usedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: EMAIL_OTP_MAX_ATTEMPTS },
        },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      const cooldownActive =
        latestOtp &&
        Date.now() - latestOtp.createdAt.getTime() < EMAIL_OTP_RESEND_DELAY_MS;
      if (!activeOtp && !cooldownActive) {
        await this.createEmailVerificationCode(user.id, user.email);
      }

      return {
        success: true,
        emailVerificationRequired: true,
        email: user.email,
        message: "Email verification is required.",
      };
    }

    return this.createSession(user);
  }

  async verifyEmail(data: VerifyEmailDto) {
    this.assertEmailVerificationEnabled();
    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true, emailVerified: true },
    });
    if (!user) throw new BadRequestException("Invalid or expired verification code");
    if (user.status !== "ACTIVE") throw new UnauthorizedException("Account is inactive");
    if (user.emailVerified) throw new ConflictException("Email is already verified");

    const now = new Date();
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: EMAIL_OTP_PURPOSE,
        usedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: EMAIL_OTP_MAX_ATTEMPTS },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) throw new BadRequestException("Invalid or expired verification code");

    const expectedHash = Buffer.from(otp.codeHash, "hex");
    const providedHash = Buffer.from(this.hashEmailCode(data.code), "hex");
    if (
      expectedHash.length !== providedHash.length ||
      !timingSafeEqual(expectedHash, providedHash)
    ) {
      await this.prisma.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: EMAIL_OTP_MAX_ATTEMPTS },
        },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Invalid or expired verification code");
    }

    const verifiedUserId = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.otpCode.updateMany({
        where: {
          id: otp.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: EMAIL_OTP_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException("Invalid or expired verification code");
      }

      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      return user.id;
    });

    const verifiedUser = await this.prisma.user.findUnique({
      where: { id: verifiedUserId },
      include: { wallet: true, _count: { select: { cards: true } } },
    });
    if (!verifiedUser) throw new UnauthorizedException("Account is unavailable");

    return {
      ...this.createSession(verifiedUser),
      message: "Email verified successfully.",
      emailVerified: true,
    };
  }

  async resendEmailVerification(data: EmailDto) {
    this.assertEmailVerificationEnabled();
    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true, emailVerified: true },
    });
    if (!user) throw new NotFoundException("EMAIL_NOT_REGISTERED");
    if (user.status !== "ACTIVE") throw new UnauthorizedException("Account is inactive");
    if (user.emailVerified) throw new ConflictException("Email is already verified");

    const latest = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, purpose: EMAIL_OTP_PURPOSE },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < EMAIL_OTP_RESEND_DELAY_MS
    ) {
      throw new HttpException(
        "Wait before requesting another code",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const now = new Date();
    await this.prisma.otpCode.updateMany({
      where: { userId: user.id, purpose: EMAIL_OTP_PURPOSE, usedAt: null },
      data: { usedAt: now },
    });
    await this.createEmailVerificationCode(user.id, user.email);

    return {
      success: true,
      emailVerificationRequired: true,
      message: "A verification code has been sent.",
    };
  }
}
