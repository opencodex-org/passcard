import { IsPhoneNumber, IsString, Matches } from "class-validator";

export class VerifyPhoneOtpDto {
  @IsString()
  @IsPhoneNumber("SA")
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
