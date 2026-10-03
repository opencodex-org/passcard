import { NotFoundException } from "@nestjs/common";
import { TestRegisterController } from "../src/test-register.controller";

describe("TestRegisterController", () => {
  it("does not expose the test registration page in production", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      expect(() => new TestRegisterController().page({} as any)).toThrow(
        NotFoundException,
      );
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});