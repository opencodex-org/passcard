import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  merchantCode!: string;
}