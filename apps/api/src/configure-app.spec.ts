import { describe, expect, it } from "vitest";
import { isAllowedCorsOrigin } from "./configure-app";

describe("isAllowedCorsOrigin", () => {
  it("allows requests without an Origin header", () => {
    expect(isAllowedCorsOrigin(undefined, ["http://localhost:5173"])).toBe(true);
  });

  it("allows exact configured origins", () => {
    expect(isAllowedCorsOrigin("http://localhost:5173", ["http://localhost:5173"])).toBe(true);
  });

  it("does not treat exact configured origins as wildcard origins", () => {
    expect(isAllowedCorsOrigin("http://downtown.localhost:5173", ["http://localhost:5173"])).toBe(
      false,
    );
    expect(
      isAllowedCorsOrigin("https://downtown.pongping.example", [
        "https://admin.pongping.example",
      ]),
    ).toBe(false);
  });

  it("allows tenant subdomains for explicit wildcard origins", () => {
    expect(
      isAllowedCorsOrigin("http://downtown.localhost:5173", ["http://*.localhost:5173"]),
    ).toBe(true);
    expect(
      isAllowedCorsOrigin("https://downtown.pongping.example", [
        "https://*.pongping.example",
      ]),
    ).toBe(true);
  });

  it("rejects unrelated origins and different ports", () => {
    expect(isAllowedCorsOrigin("https://evil.example", ["https://*.pongping.example"])).toBe(
      false,
    );
    expect(
      isAllowedCorsOrigin("http://downtown.localhost:5174", ["http://*.localhost:5173"]),
    ).toBe(false);
    expect(isAllowedCorsOrigin("http://localhost:5173", ["http://*.localhost:5173"])).toBe(false);
  });
});
