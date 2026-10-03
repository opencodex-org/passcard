import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../admin/admin.guard";
import { CreateCashierDto } from "./dto/create-cashier.dto";
import { CashiersService } from "./cashiers.service";

@Controller("cashiers")
@UseGuards(JwtAuthGuard, AdminGuard)
export class CashiersController {
  constructor(private readonly cashiersService: CashiersService) {}

  @Post()
  create(@Body() data: CreateCashierDto) {
    return this.cashiersService.create(data);
  }
}