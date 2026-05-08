import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";
import { SystemHostGuard } from "./system-host.guard";

describe("SystemHostGuard", () => {
  it.each([
    ["root", "example.test", { status: "missing" }, true],
    ["reserved", "api.example.test", { status: "reserved" }, true],
    ["tenant", "acme.example.test", { status: "resolved", slug: "acme" }, false],
    ["invalid root", "acme.other.test", { status: "invalid_root" }, false],
  ] as const)("handles %s host", (_name, host, resolution, allowed) => {
    const guard = new SystemHostGuard({
      parseHost: vi.fn(() => resolution),
    } as never);

    if (allowed) {
      expect(guard.canActivate(executionContext(host))).toBe(true);
    } else {
      expect(() => guard.canActivate(executionContext(host))).toThrow(ForbiddenException);
    }
  });

  it("uses host header for system host checks", () => {
    const parseHost = vi.fn(() => ({ status: "reserved" as const }));
    const guard = new SystemHostGuard({ parseHost } as never);

    expect(
      guard.canActivate(executionContext("api.example.test", { "x-forwarded-host": "tenant.example.test" })),
    ).toBe(true);
    expect(parseHost).toHaveBeenCalledWith("api.example.test");
  });
});

function executionContext(host: string, headers: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () =>
        ({
          headers: { host, ...headers },
        }) as Request,
    }),
  } as ExecutionContext;
}
