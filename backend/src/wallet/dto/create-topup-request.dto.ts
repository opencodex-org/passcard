import { IsInt, IsUUID, Max, Min } from "class-validator";

export class CreateTopupRequestDto {
  @IsInt()
  @Min(100)
  @Max(2147483647)
  amountMinor!: number;

  @IsUUID()
  idempotencyKey!: string;
}
