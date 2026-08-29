import { Injectable } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  async register(data: RegisterDto) {
    return {
      success: true,
      message: "Registration request received.",
      user: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    };
  }

  async login(data: LoginDto) {
    return {
      success: true,
      message: "Login request received.",
      email: data.email,
    };
  }
}
