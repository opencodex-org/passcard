import { AppController } from "../src/app.controller";

describe("AppController", () => {
  it("returns a minimal health response", () => {
    expect(new AppController().health()).toEqual({ status: "ok" });
  });
});