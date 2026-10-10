import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { AdminTopupsService } from "./admin-topups.service";
import { AdminTopupDto } from "./dto/admin-topup.dto";
import { AdminReviewDto } from "./dto/admin-review.dto";
import { AdminUserSearchDto } from "./dto/admin-user-search.dto";
import { CreateCardLevelDto } from "./dto/create-card-level.dto";

type AdminRequest = Request & { user: { userId: string; role: string } };

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTopupsController {
  constructor(
    private readonly adminTopupsService: AdminTopupsService,
    private readonly adminService: AdminService,
  ) {}

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

  @Get("card-levels")
  listCardLevels() {
    return this.adminTopupsService.listCardLevels();
  }

  @Post("card-levels")
  createCardLevel(@Body() data: CreateCardLevelDto) {
    return this.adminTopupsService.createCardLevel(data);
  }

  @Get("users")
  searchUsers(@Query() query: AdminUserSearchDto) {
    return this.adminTopupsService.searchUsers(query.search);
  }

  @Get("users/:userId/cards")
  getUserCards(@Param("userId") userId: string) {
    return this.adminTopupsService.getUserCards(userId);
  }

  @Post("topups")
  createTopup(@Req() request: AdminRequest, @Body() data: AdminTopupDto) {
    return this.adminTopupsService.create(request.user.userId, data);
  }

  @Get("topups")
  listTopups() {
    return this.adminTopupsService.list();
  }

  @Get("topup-requests")
  listTopupRequests() {
    return this.adminTopupsService.listTopupRequests();
  }

  @Post("topup-requests/:requestId/review")
  reviewTopupRequest(
    @Req() request: AdminRequest,
    @Param("requestId") requestId: string,
    @Body() data: AdminReviewDto,
  ) {
    return this.adminTopupsService.reviewTopupRequest(
      request.user.userId,
      requestId,
      data,
    );
  }
}
