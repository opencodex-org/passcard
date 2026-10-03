import { IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @IsNotEmpty()
  purpose!: string;
}
