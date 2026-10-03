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
import { AdminTopupsService } from "./admin-topups.service";
import { AdminTopupDto } from "./dto/admin-topup.dto";
import { AdminUserSearchDto } from "./dto/admin-user-search.dto";

type AdminRequest = Request & { user: { userId: string; role: string } };

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTopupsController {
  constructor(private readonly adminTopupsService: AdminTopupsService) {}

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
}