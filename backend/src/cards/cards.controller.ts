import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { CardsService } from "./cards.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateCardDto } from "./dto/create-card.dto";

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller("cards")
export class CardsController {
constructor(private readonly cardsService: CardsService) {}

@Get("options")
options() {
return this.cardsService.findOptions();
}

@Get("levels")
levels() {
return this.cardsService.findActiveLevels();
}

@Post()
@UseGuards(JwtAuthGuard)
create(
@Req() request: AuthenticatedRequest,
@Body() body: CreateCardDto,
) {
return this.cardsService.create(request.user.userId, body);
}

@Get("mine")
@UseGuards(JwtAuthGuard)
mine(@Req() request: AuthenticatedRequest) {
return this.cardsService.findMine(request.user.userId);
}
}
