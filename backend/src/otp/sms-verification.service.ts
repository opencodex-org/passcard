import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import twilio from "twilio";

@Injectable()
export class SmsVerificationService {
  private getVerifyService() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !serviceSid) {
      throw new ServiceUnavailableException(
        "Phone verification is temporarily unavailable",
      );
    }

    return twilio(accountSid, authToken).verify.v2.services(serviceSid);
  }

  async send(phone: string): Promise<void> {
    try {
      const verification = await this.getVerifyService().verifications.create({
        to: phone,
        channel: "sms",
      });

      if (verification.status !== "pending") {
        throw new Error("Verification was not created");
      }
    } catch {
      throw new ServiceUnavailableException(
        "Phone verification is temporarily unavailable",
      );
    }
  }

  async verify(phone: string, code: string): Promise<boolean> {
    try {
      const result = await this.getVerifyService().verificationChecks.create({
        to: phone,
        code,
      });

      return result.status === "approved";
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 404
      ) {
        return false;
      }

      throw new ServiceUnavailableException(
        "Phone verification is temporarily unavailable",
      );
    }
  }
}