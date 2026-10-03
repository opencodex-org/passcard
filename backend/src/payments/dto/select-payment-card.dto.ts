import { IsUUID } from "class-validator";

export class SelectPaymentCardDto {
  @IsUUID()
  cardId!: string;
}