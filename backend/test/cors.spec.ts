import { isCorsOriginAllowed } from "../src/cors";

describe("CORS origin policy", () => {
  it("allows only the current deployed frontend origin in production", () => {
    expect(
      isCorsOriginAllowed(
        "https://passcard.esamif1234567890.workers.dev",
        "production",
        "",
      ),
    ).toBe(true);
    expect(
      isCorsOriginAllowed("http://localhost:3000", "production", ""),
    ).toBe(false);
    expect(
      isCorsOriginAllowed("https://untrusted.example", "production", ""),
    ).toBe(false);
    expect(
      isCorsOriginAllowed(
        "https://untrusted.example",
        "production",
        "https://untrusted.example",
      ),
    ).toBe(false);
  });

  it("allows local development and configured origins", () => {
    expect(isCorsOriginAllowed("http://localhost:3000", "development", "")).toBe(
      true,
    );
    expect(
      isCorsOriginAllowed(
        "https://preview.passcard.dev",
        "development",
        "https://preview.passcard.dev",
      ),
    ).toBe(true);
  });
});