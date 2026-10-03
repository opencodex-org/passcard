import { IsPhoneNumber, IsString } from "class-validator";

export class SendPhoneOtpDto {
  @IsString()
  @IsPhoneNumber("SA")
  phone!: string;
}
