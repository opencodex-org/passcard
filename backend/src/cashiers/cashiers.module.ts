import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CashiersController } from "./cashiers.controller";
import { CashiersService } from "./cashiers.service";
import { AdminGuard } from "../admin/admin.guard";

@Module({
  controllers: [CashiersController],
  providers: [CashiersService, PrismaService, AdminGuard],
})
export class CashiersModule {}