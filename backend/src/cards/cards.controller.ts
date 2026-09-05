import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { CardsService } from "./cards.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("cards")
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  create(@Req() req: any, @Body() body: { cardLevelId: string }) {
    return this.cardsService.create(req.user.userId, body.cardLevelId);
  }

  @Get("mine")
  mine(@Req() req: any) {
    return this.cardsService.findMine(req.user.userId);
  }
}
