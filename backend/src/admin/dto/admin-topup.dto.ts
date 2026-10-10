import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class AdminTopupDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  cardId?: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  amountMinor!: number;

  @IsUUID()
  idempotencyKey!: string;
}