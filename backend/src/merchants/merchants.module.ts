import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  MerchantPaymentsController,
  MerchantsController,
} from "./merchants.controller";
import { MerchantsService } from "./merchants.service";
import { AdminGuard } from "../admin/admin.guard";

@Module({
  controllers: [MerchantsController, MerchantPaymentsController],
  providers: [MerchantsService, PrismaService, AdminGuard],
  exports: [MerchantsService],
})
export class MerchantsModule {}