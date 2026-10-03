import { IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";

export class CreateCashierDto {
  @IsUUID()
  merchantId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  code!: string;
}