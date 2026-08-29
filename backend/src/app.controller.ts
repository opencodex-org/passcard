import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "passcard-backend",
      environment: process.env.NODE_ENV || "development",
    };
  }
}
