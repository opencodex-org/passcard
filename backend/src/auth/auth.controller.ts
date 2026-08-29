import { Controller, Get } from "@nestjs/common";

@Controller("auth")
export class AuthController {
  @Get("status")
  status() {
    return {
      authenticated: false,
      message: "Authentication service is ready.",
    };
  }
}
