/* global fetch */
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import nodemailer from "nodemailer";

const DEFAULT_EMAIL_FROM = "PassCard <no-reply@passcard.com>";

type SmtpProvider = {
  host: string;
  port: number;
  user: string;
  password: string;
  from?: string;
};

@Injectable()
export class EmailService {
  private getProviders(): SmtpProvider[] {
    const providers: SmtpProvider[] = [];
    const addProvider = (
      host: string | undefined,
      port: number,
      user: string | undefined,
      password: string | undefined,
      from?: string,
    ) => {
      if (
        host?.trim() &&
        Number.isInteger(port) &&
        port > 0 &&
        port <= 65535 &&
        user?.trim() &&
        password?.trim()
      ) {
        providers.push({
          host: host.trim(),
          port,
          user: user.trim(),
          password,
          from,
        });
      }
    };

    addProvider(
      "smtp-relay.brevo.com",
      587,
      process.env.BREVO_SMTP_USER,
      process.env.BREVO_SMTP_PASSWORD,
    );
    addProvider(
      process.env.AWS_SES_SMTP_HOST,
      Number(process.env.AWS_SES_SMTP_PORT || 587),
      process.env.AWS_SES_SMTP_USER,
      process.env.AWS_SES_SMTP_PASSWORD,
    );
    addProvider(
      "smtp.gmail.com",
      587,
      process.env.GMAIL_SMTP_USER,
      process.env.GMAIL_SMTP_PASSWORD,
      process.env.GMAIL_EMAIL_FROM || process.env.GMAIL_SMTP_USER,
    );
    addProvider(
      process.env.SMTP_HOST,
      Number(process.env.SMTP_PORT || 587),
      process.env.SMTP_USER,
      process.env.SMTP_PASSWORD,
    );

    return providers;
  }

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY?.trim() || this.getProviders().length);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const from = process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const providers = this.getProviders();
    if (!resendApiKey && !providers.length) {
      throw new ServiceUnavailableException(
        "Email verification is temporarily unavailable",
      );
    }

    if (resendApiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: "رمز التحقق من بريد PassCard",
            text: `رمز التحقق الخاص بك هو ${code}. تنتهي صلاحيته خلال 5 دقائق.`,
            html: `<p>رمز التحقق الخاص بك هو:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>تنتهي صلاحيته خلال 5 دقائق.</p>`,
          }),
        });

        if (response.ok) return;
      } catch {
        // Continue to configured SMTP providers if Resend is unavailable.
      }
    }

    for (const provider of providers) {
      try {
        const transporter = nodemailer.createTransport({
          host: provider.host,
          port: provider.port,
          secure: provider.port === 465,
          auth: {
            user: provider.user,
            pass: provider.password,
          },
        });

        await transporter.sendMail({
          from: provider.from || from,
          to: email,
          subject: "رمز التحقق من بريد PassCard",
          text: `رمز التحقق الخاص بك هو ${code}. تنتهي صلاحيته خلال 5 دقائق.`,
          html: `<p>رمز التحقق الخاص بك هو:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>تنتهي صلاحيته خلال 5 دقائق.</p>`,
        });
        return;
      } catch {
        continue;
      }
    }

    throw new ServiceUnavailableException(
      "تعذر إرسال رسالة التحقق. حاول لاحقاً.",
    );
  }
}
