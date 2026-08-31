import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";

import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "1010378538216-jqt8nn2e3brtlplhr4jcore830ef2aqp.apps.googleusercontent.com";

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

  async google(credential: string) {
    if (!credential?.trim()) {
      throw new BadRequestException("Google credential is required");
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException(
          "Invalid Google account information",
        );
      }

      return {
        success: true,
        message: "Google authentication successful.",
        user: {
          id: payload.sub,
          name: payload.name || "",
          email: payload.email,
          picture: payload.picture || "",
        },
        security: {
          authenticated: true,
          emailVerified: payload.email_verified === true,
          phoneVerified: false,
          identityVerified: false,
        },
      };
    } catch {
      throw new UnauthorizedException(
        "Google authentication failed",
      );
    }
  }
}
