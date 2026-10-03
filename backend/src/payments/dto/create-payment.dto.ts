import { IsInt, IsUUID, Min } from "class-validator";

export class CreatePaymentDto {
  @IsUUID()
  cardId!: string;

  @IsInt()
  @Min(1)
  amountMinor!: number;
}