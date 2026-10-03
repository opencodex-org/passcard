import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminController } from "./admin.controller";
import { AdminGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { AdminTopupsController } from "./admin-topups.controller";
import { AdminTopupsService } from "./admin-topups.service";

@Module({
  controllers: [AdminController, AdminTopupsController],
  providers: [AdminService, AdminTopupsService, AdminGuard, JwtAuthGuard, PrismaService],
})
export class AdminModule {}