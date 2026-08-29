import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  async register(data: RegisterDto) {
    if (!data.name?.trim()) {
      throw new BadRequestException("Name is required");
    }

    if (!data.email?.trim()) {
      throw new BadRequestException("Email is required");
    }

    if (!data.phone?.trim()) {
      throw new BadRequestException("Phone is required");
    }

    if (!data.password || data.password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters",
      );
    }

    return {
      success: true,
      message: "Registration request received.",
      user: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
      },
      security: {
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
      },
      card: {
        level: "BASIC",
        status: "NOT_CREATED",
      },
    };
  }

  async login(data: LoginDto) {
    if (!data.email?.trim() || !data.password) {
      throw new BadRequestException(
        "Email and password are required",
      );
    }

    if (data.password.length < 8) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      success: true,
      message: "Login request received.",
      user: {
        email: data.email.trim().toLowerCase(),
      },
      security: {
        authenticated: true,
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
      },
    };
  }
}
