import { IsInt, IsUUID, Min } from "class-validator";

export class CreateMerchantPaymentDto {
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsUUID()
  merchantId!: string;

  @IsUUID()
  cashierId!: string;
}