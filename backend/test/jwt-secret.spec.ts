import { getJwtSecret } from "../src/auth/jwt-secret";

describe("JWT secret configuration", () => {
  const previousSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it("requires a secret from the environment", () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow("JWT_SECRET is required");
  });

  it("uses the configured environment secret", () => {
    process.env.JWT_SECRET = "test-only-jwt-secret";
    expect(getJwtSecret()).toBe("test-only-jwt-secret");
  });
});