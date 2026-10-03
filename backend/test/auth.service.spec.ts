import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, scryptSync } from "node:crypto";
import { AuthService } from "../src/auth/auth.service";

const email = "test@example.com";
const password = "safe-test-password";
const code = "135790";
const passwordHash = `test-salt:${scryptSync(password, "test-salt", 64).toString("hex")}`;
const previousJwtSecret = process.env.JWT_SECRET;
const previousEmailVerification = process.env.EMAIL_VERIFICATION_ENABLED;

beforeAll(() => {
  process.env.JWT_SECRET ??= "test-only-auth-secret";
  process.env.EMAIL_VERIFICATION_ENABLED = "true";
});

afterAll(() => {
  if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousJwtSecret;
  if (previousEmailVerification === undefined) {
    delete process.env.EMAIL_VERIFICATION_ENABLED;
  } else {
    process.env.EMAIL_VERIFICATION_ENABLED = previousEmailVerification;
  }
});

function userRecord(verified = false) {
  return {
    id: "user-1",
    name: "Test User",
    email,
    phone: "0500000000",
    passwordHash,
    dateOfBirth: new Date("1990-01-01"),
    ageGroup: "ADULT",
    role: "USER",
    status: "ACTIVE",
    wallet: { balanceMinor: 0, points: 0 },
    _count: { cards: 0 },
    emailVerified: verified,
    phoneVerified: false,
    identityVerified: false,
  };
}

function makePrisma() {
  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    otpCode: {
      create: jest.fn().mockResolvedValue({ id: "otp-1" }),
      findFirst: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(),
  } as any;
}

function makeEmailService() {
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    sendVerificationCode: jest.fn().mockResolvedValue(undefined),
  } as any;
}

describe("AuthService registration and login", () => {
  it("does not create an account when email delivery is unavailable", async () => {
    const prisma = makePrisma();
    const emailService = makeEmailService();
    emailService.isConfigured.mockReturnValue(false);

    await expect(
      new AuthService(prisma, emailService).register({
        name: "Test User",
        email,
        phone: "0500000000",
        dateOfBirth: "1990-01-01",
        password,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("registers without email OTP when email verification is disabled", async () => {
    const previous = process.env.EMAIL_VERIFICATION_ENABLED;
    process.env.EMAIL_VERIFICATION_ENABLED = "false";
    const prisma = makePrisma();
    prisma.user.create.mockResolvedValue(userRecord(false));
    const emailService = makeEmailService();
    emailService.isConfigured.mockReturnValue(false);

    try {
      const result = await new AuthService(prisma, emailService).register({
        name: "Test User",
        email,
        phone: "0500000000",
        dateOfBirth: "1990-01-01",
        password,
      });

      expect(result).toMatchObject({
        emailVerificationRequired: false,
        security: { emailVerified: true },
        user: { role: "USER" },
      });
      expect(result).toHaveProperty("token");
      expect(prisma.otpCode.create).not.toHaveBeenCalled();
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.EMAIL_VERIFICATION_ENABLED;
      else process.env.EMAIL_VERIFICATION_ENABLED = previous;
    }
  });

  it("allows login without email OTP when email verification is disabled", async () => {
    const previous = process.env.EMAIL_VERIFICATION_ENABLED;
    process.env.EMAIL_VERIFICATION_ENABLED = "false";
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(userRecord(false));

    try {
      const result = await new AuthService(prisma, makeEmailService()).login({
        email,
        password,
      });

      expect(result).toMatchObject({
        security: { emailVerified: true },
      });
      expect(result).toHaveProperty("token");
      expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.EMAIL_VERIFICATION_ENABLED;
      else process.env.EMAIL_VERIFICATION_ENABLED = previous;
    }
  });

  it("registers once, creates a wallet, and requests email verification", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const prisma = makePrisma();
    const emailService = makeEmailService();
    prisma.user.create.mockResolvedValue({
      ...userRecord(),
      wallet: { balanceMinor: 0, points: 0 },
    });

    let result: Awaited<ReturnType<AuthService["register"]>>;
    try {
      result = await new AuthService(prisma, emailService).register({
        name: " Test User ",
        email: "TEST@EXAMPLE.COM",
        phone: "0500000000",
        dateOfBirth: "1990-01-01",
        password,
      });
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }

    expect("emailVerificationRequired" in result && result.emailVerificationRequired).toBe(true);
    expect(result.user.email).toBe(email);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email,
          wallet: { create: { balanceMinor: 0, points: 0 } },
        }),
      }),
    );
    expect(prisma.otpCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", purpose: "EMAIL_VERIFICATION" }),
      }),
    );
    expect(result).not.toHaveProperty("token");
    expect(result).not.toHaveProperty("developmentCode");
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      email,
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("regenerates a code when it matches an active code for the same user", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const prisma = makePrisma();
    prisma.user.create.mockResolvedValue(userRecord());
    prisma.otpCode.findFirst
      .mockResolvedValueOnce({ id: "existing-otp" })
      .mockResolvedValueOnce(null);
    const emailService = makeEmailService();

    try {
      await new AuthService(prisma, emailService).register({
        name: "Test User",
        email,
        phone: "0500000000",
        dateOfBirth: "1990-01-01",
        password,
      });
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }

    expect(prisma.otpCode.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.otpCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          purpose: "EMAIL_VERIFICATION",
          createdAt: { gt: expect.any(Date) },
        }),
      }),
    );
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      email,
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("never exposes a generated email code in development", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const prisma = makePrisma();
    prisma.user.create.mockResolvedValue({
      ...userRecord(),
      email: "dev-code@example.com",
      wallet: { balanceMinor: 0, points: 0 },
    });

    try {
      const emailService = makeEmailService();
      const result = await new AuthService(prisma, emailService).register({
        name: "Test User",
        email: "dev-code@example.com",
        phone: "0500000001",
        dateOfBirth: "1990-01-01",
        password,
      });
      expect(result).not.toHaveProperty("developmentCode");
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        "dev-code@example.com",
        expect.stringMatching(/^\d{6}$/),
      );
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("never returns a development OTP in production", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const prisma = makePrisma();
    prisma.user.create.mockResolvedValue({
      ...userRecord(),
      wallet: { balanceMinor: 0, points: 0 },
    });

    try {
      const result = await new AuthService(prisma, makeEmailService()).register({
        name: "Test User",
        email: "production@example.com",
        phone: "0500000002",
        dateOfBirth: "1990-01-01",
        password,
      });
      expect(result).not.toHaveProperty("developmentCode");
      expect(prisma.otpCode.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ codeHash: expect.any(String) }) }),
      );
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("rejects duplicate registration", async () => {
    const prisma = makePrisma();
    prisma.user.findFirst.mockResolvedValue({ id: "user-1", email, phone: "0500000000" });

    await expect(
      new AuthService(prisma, makeEmailService()).register({
        name: "Test User",
        email,
        phone: "0500000000",
        dateOfBirth: "1990-01-01",
        password,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("logs in a verified account and issues a JWT", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(userRecord(true));

    const result = await new AuthService(prisma, makeEmailService()).login({ email, password });

    expect(result).toMatchObject({ success: true, user: { email }, security: { emailVerified: true } });
    expect(result).toHaveProperty("token");
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });

  it("does not issue a JWT to a verified-password but unverified-email account", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(userRecord(false));
    prisma.otpCode.findFirst
      .mockResolvedValueOnce({ createdAt: new Date() })
      .mockResolvedValueOnce({ id: "otp-1" });

    const result = await new AuthService(prisma, makeEmailService()).login({ email, password });

    expect("emailVerificationRequired" in result && result.emailVerificationRequired).toBe(true);
    expect(result).not.toHaveProperty("token");
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });

  it("creates a verification request after a correct login when no active code exists", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(userRecord(false));
    prisma.otpCode.findFirst.mockResolvedValue(null);

    const result = await new AuthService(prisma, makeEmailService()).login({ email, password });

    expect("emailVerificationRequired" in result && result.emailVerificationRequired).toBe(true);
    expect(result).not.toHaveProperty("token");
    expect(prisma.otpCode.create).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown email without creating an account", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      new AuthService(prisma, makeEmailService()).login({ email, password }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a wrong password without requesting OTP", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(userRecord(false));

    await expect(
      new AuthService(prisma, makeEmailService()).login({ email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });
});

describe("AuthService email verification", () => {
  function validOtp() {
    return {
      id: "otp-1",
      userId: "user-1",
      purpose: "EMAIL_VERIFICATION",
      codeHash: createHash("sha256").update(code).digest("hex"),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      usedAt: null,
      createdAt: new Date(),
    };
  }

  it("verifies email once and returns the authenticated session", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: "user-1", status: "ACTIVE", emailVerified: false })
      .mockResolvedValueOnce(userRecord(true));
    prisma.otpCode.findFirst.mockResolvedValue(validOtp());
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
      callback({
        otpCode: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        user: { update: jest.fn().mockResolvedValue({}) },
      }),
    );

    const result = await new AuthService(prisma, makeEmailService()).verifyEmail({ email, code });

    expect(result.emailVerified).toBe(true);
    expect(result).toHaveProperty("token");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid code and increments attempts", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", status: "ACTIVE", emailVerified: false });
    prisma.otpCode.findFirst.mockResolvedValue(validOtp());

    await expect(
      new AuthService(prisma, makeEmailService()).verifyEmail({ email, code: "000000" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.otpCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } }),
    );
  });

  it.each(["expired", "used", "attempt-limit"])("rejects %s OTP", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", status: "ACTIVE", emailVerified: false });
    prisma.otpCode.findFirst.mockResolvedValue(null);

    await expect(
      new AuthService(prisma, makeEmailService()).verifyEmail({ email, code }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throttles repeated resend requests", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", email, status: "ACTIVE", emailVerified: false });
    prisma.otpCode.findFirst.mockResolvedValue({ createdAt: new Date() });

    await expect(
      new AuthService(prisma, makeEmailService()).resendEmailVerification({ email }),
    ).rejects.toMatchObject({ status: 429 });
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });
});
