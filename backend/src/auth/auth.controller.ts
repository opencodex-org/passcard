import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post("login")
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post("google")
  async google(@Body() data: GoogleAuthDto) {
    return this.authService.google(data.credential);
  }
}
