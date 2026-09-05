import { Body, Controller, Post } from "@nestjs/common";
import { OtpService } from "./otp.service";

@Controller("otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("send")
  send(@Body() body: { phone: string }) {
    return this.otpService.send(body.phone);
  }

  @Post("verify")
  verify(@Body() body: { phone: string; code: string }) {
    return this.otpService.verify(body.phone, body.code);
  }
}
