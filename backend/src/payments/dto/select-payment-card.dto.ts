import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SelectPaymentCardDto {
  @IsUUID()
  cardId!: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  checkoutToken?: string;
}
