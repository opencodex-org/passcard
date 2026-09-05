import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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

  async register(data: RegisterDto) {
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

    const user = await this.prisma.user.create({
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

    return {
      success: true,
      message: "Account created successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        age: age,
        ageGroup: user.ageGroup,
      },
      wallet: {
        balanceMinor: user.wallet?.balanceMinor ?? 0,
        points: user.wallet?.points ?? 0,
      },
      cards: {
        count: user._count.cards,
      },
      security: {
        emailVerified: user.emailVerified,
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
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await this.verifyPassword(
      data.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || "passcard-dev-secret",
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
      },
      wallet: {
        balanceMinor: user.wallet?.balanceMinor ?? 0,
        points: user.wallet?.points ?? 0,
      },
      cards: {
        count: user._count.cards,
      },
      security: {
        authenticated: true,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        identityVerified: user.identityVerified,
      },
    };
  }
}
