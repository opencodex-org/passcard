import { IsInt, IsUUID, Max, Min } from "class-validator";

export class AdminTopupDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  cardId!: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  amountMinor!: number;

  @IsUUID()
  idempotencyKey!: string;
}