import { sign, verify } from "jsonwebtoken";

const testSecret = "test-only-jwt-secret-never-used-outside-tests";

describe("JWT signature and expiry checks", () => {
  it("rejects a token with an invalid signature", () => {
    const token = sign({ sub: "user-1" }, "different-test-secret");
    expect(() => verify(token, testSecret)).toThrow();
  });

  it("rejects an expired token", () => {
    const token = sign({ sub: "user-1" }, testSecret, { expiresIn: -1 });
    expect(() => verify(token, testSecret)).toThrow();
  });

  it("accepts a correctly signed token", () => {
    const token = sign({ sub: "user-1", email: "verified@example.test" }, testSecret);
    expect(verify(token, testSecret)).toMatchObject({
      sub: "user-1",
      email: "verified@example.test",
    });
  });
});
