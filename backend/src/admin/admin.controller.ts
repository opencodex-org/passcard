import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AdminService } from "./admin.service";
import { AdminReviewDto } from "./dto/admin-review.dto";
import { AdminUserActionDto } from "./dto/admin-user-action.dto";

@Controller("passcard-by-open-codex-admin_4hhh5d47j533fk73j")
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Post("card-requests/:requestId/review")
  reviewCardRequest(
    @Param("requestId") requestId: string,
    @Body() data: AdminReviewDto,
  ) {
    return this.adminService.reviewCardRequest(requestId, data);
  }

  @Post("users/:userId/action")
  userAction(
    @Param("userId") userId: string,
    @Body() data: AdminUserActionDto,
  ) {
    return this.adminService.userAction(userId, data);
  }
}
