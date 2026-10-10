import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminService } from "./admin.service";
import { AdminReviewDto } from "./dto/admin-review.dto";
import { AdminUserActionDto } from "./dto/admin-user-action.dto";
import { AdminGuard } from "./admin.guard";

type AdminRequest = Request & { user: { userId: string; role: string } };

@Controller("passcard-by-open-codex-admin_4hhh5d47j533fk73j")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get("card-requests")
  listCardRequests() {
    return this.adminService.listPendingCardRequests();
  }

  @Post("card-requests/:requestId/review")
  reviewCardRequest(
    @Req() request: AdminRequest,
    @Param("requestId") requestId: string,
    @Body() data: AdminReviewDto,
  ) {
    return this.adminService.reviewCardRequest(requestId, request.user.userId, data);
  }

  @Post("users/:userId/action")
  userAction(
    @Req() request: AdminRequest,
    @Param("userId") userId: string,
    @Body() data: AdminUserActionDto,
  ) {
    return this.adminService.userAction(userId, request.user.userId, data);
  }
}
