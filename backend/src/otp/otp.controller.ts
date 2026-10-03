import { Body, Controller, Post } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { SendPhoneOtpDto } from "./dto/send-phone-otp.dto";
import { VerifyPhoneOtpDto } from "./dto/verify-phone-otp.dto";

@Controller("otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("send")
  send(@Body() body: SendPhoneOtpDto) {
    return this.otpService.send(body.phone);
  }

  @Post("verify")
  verify(@Body() body: VerifyPhoneOtpDto) {
    return this.otpService.verify(body.phone, body.code);
  }
}
