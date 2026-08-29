import {
  Body,
  Controller,
  Get,
  Post,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post("login")
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get("status")
  status() {
    return {
      authenticated: false,
      service: "passcard-auth",
      status: "ready",
    };
  }
}
