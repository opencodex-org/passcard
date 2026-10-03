import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { OtpService } from "../src/otp/otp.service";
import { SmsVerificationService } from "../src/otp/sms-verification.service";

describe("OtpService", () => {
  function setup() {
    const createdChallenge = { id: "otp-1" };
    const txOtpUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const txOtpCreate = jest.fn().mockResolvedValue(createdChallenge);
    const userUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "user-1",
          phoneVerified: false,
        }),
      },
      otpCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          otpCode: {
            updateMany: txOtpUpdateMany,
            create: txOtpCreate,
          },
          user: { update: userUpdate },
        }),
      ),
    } as any;
    const smsVerification = {
      send: jest.fn().mockResolvedValue(undefined),
      verify: jest.fn().mockResolvedValue(true),
    } as any;

    return {
      service: new OtpService(prisma, smsVerification),
      prisma,
      smsVerification,
      txOtpCreate,
      txOtpUpdateMany,
      userUpdate,
    };
  }

  it("sends a real SMS without returning or storing the OTP", async () => {
    const { service, smsVerification, txOtpCreate } = setup();

    const result = await service.send("0500000000");

    expect(result).toEqual({
      success: true,
      message: "A phone verification code has been sent.",
    });
    expect(result).not.toHaveProperty("developmentCode");
    expect(smsVerification.send).toHaveBeenCalledWith("+966500000000");
    expect(txOtpCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          purpose: "PHONE_VERIFICATION",
          codeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
  });

  it("marks phone verification complete only after provider approval", async () => {
    const { service, prisma, smsVerification, userUpdate } = setup();
    prisma.otpCode.findFirst.mockResolvedValue({
      id: "otp-1",
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await service.verify("+966500000000", "123456");

    expect(smsVerification.verify).toHaveBeenCalledWith(
      "+966500000000",
      "123456",
    );
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { phoneVerified: true },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unapproved code and increments attempts", async () => {
    const { service, prisma, smsVerification } = setup();
    smsVerification.verify.mockResolvedValue(false);
    prisma.otpCode.findFirst.mockResolvedValue({
      id: "otp-1",
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.verify("0500000000", "123456"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.otpCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "otp-1" }),
        data: { attempts: { increment: 1 } },
      }),
    );
  });

  it("does not send SMS without Twilio configuration", async () => {
    const names = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_VERIFY_SERVICE_SID",
    ] as const;
    const previous = names.map((name) => process.env[name]);
    for (const name of names) delete process.env[name];

    try {
      await expect(new SmsVerificationService().send("+966500000000")).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    } finally {
      names.forEach((name, index) => {
        const value = previous[index];
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      });
    }
  });
});