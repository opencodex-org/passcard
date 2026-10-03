import { ServiceUnavailableException } from "@nestjs/common";
import nodemailer from "nodemailer";
import { EmailService } from "../src/auth/email.service";

describe("EmailService", () => {
  const names = [
    "EMAIL_FROM",
    "RESEND_API_KEY",
    "BREVO_SMTP_USER",
    "BREVO_SMTP_PASSWORD",
    "AWS_SES_SMTP_HOST",
    "AWS_SES_SMTP_PORT",
    "AWS_SES_SMTP_USER",
    "AWS_SES_SMTP_PASSWORD",
    "GMAIL_SMTP_USER",
    "GMAIL_SMTP_PASSWORD",
    "GMAIL_EMAIL_FROM",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    names.forEach((name) => delete process.env[name]);
    process.env.EMAIL_FROM = "PassCard <no-reply@passcard.com>";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    names.forEach((name) => {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  it("requires an email provider instead of returning a development code", async () => {
    process.env.NODE_ENV = "development";
    await expect(
      new EmailService().sendVerificationCode("user@example.com", "123456"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("falls back in provider order and stops after the first successful send", async () => {
    process.env.RESEND_API_KEY = "resend-key";
    process.env.BREVO_SMTP_USER = "brevo-user";
    process.env.BREVO_SMTP_PASSWORD = "brevo-password";
    process.env.AWS_SES_SMTP_HOST = "email-smtp.us-east-1.amazonaws.com";
    process.env.AWS_SES_SMTP_USER = "ses-user";
    process.env.AWS_SES_SMTP_PASSWORD = "ses-password";
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false } as Response);
    const failedSend = jest.fn().mockRejectedValue(new Error("unavailable"));
    const successfulSend = jest.fn().mockResolvedValue({});
    const createTransport = jest
      .spyOn(nodemailer, "createTransport")
      .mockReturnValueOnce(
        { sendMail: failedSend } as unknown as ReturnType<typeof nodemailer.createTransport>,
      )
      .mockReturnValueOnce(
        { sendMail: successfulSend } as unknown as ReturnType<typeof nodemailer.createTransport>,
      );

    await new EmailService().sendVerificationCode("user@example.com", "123456");

    expect(createTransport).toHaveBeenCalledTimes(2);
    expect(createTransport.mock.calls.map(([options]) => options)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ host: "smtp-relay.brevo.com", port: 587 }),
        expect.objectContaining({
          host: "email-smtp.us-east-1.amazonaws.com",
          port: 587,
        }),
      ]),
    );
    expect(successfulSend).toHaveBeenCalledTimes(1);
    expect(successfulSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PassCard <no-reply@passcard.com>",
        to: "user@example.com",
        text: expect.stringContaining("123456"),
        html: expect.stringContaining("123456"),
      }),
    );
  });

  it("uses the Gmail account as sender when Gmail is the configured provider", async () => {
    process.env.GMAIL_SMTP_USER = "sender@gmail.com";
    process.env.GMAIL_SMTP_PASSWORD = "gmail-app-password";
    process.env.GMAIL_EMAIL_FROM = "sender@gmail.com";
    const sendMail = jest.fn().mockResolvedValue({});
    const createTransport = jest
      .spyOn(nodemailer, "createTransport")
      .mockReturnValue({
        sendMail,
      } as unknown as ReturnType<typeof nodemailer.createTransport>);

    await new EmailService().sendVerificationCode("user@example.com", "123456");

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.gmail.com", port: 587 }),
    );
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "sender@gmail.com" }),
    );
  });

  it("defaults to the PassCard sender when EMAIL_FROM is not set", async () => {
    delete process.env.EMAIL_FROM;
    process.env.RESEND_API_KEY = "resend-key";
    const fetch = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    await new EmailService().sendVerificationCode("user@example.com", "123456");

    const requestBody = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(requestBody.from).toBe("PassCard <no-reply@passcard.com>");
    expect(requestBody.to).toBe("user@example.com");
    expect(requestBody.html).toContain("123456");
  });

  it("sends through the Resend API when its API key is configured", async () => {
    process.env.RESEND_API_KEY = "resend-key";
    const fetch = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    await new EmailService().sendVerificationCode("user@example.com", "123456");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer resend-key",
        }),
      }),
    );
  });
});