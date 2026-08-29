import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";

@Controller("passcard-by-open-codex-admin_4hhh5d47j533fk73j")
@UseGuards(AuthGuard)
export class AdminController {
  @Get("dashboard")
  dashboard() {
    return {
      success: true,
      area: "admin",
      message: "Admin dashboard is protected.",
    };
  }
}
