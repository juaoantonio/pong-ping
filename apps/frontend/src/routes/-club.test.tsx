import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/errors";
import { authKeys } from "@/lib/api/system-admin";
import { tenantAuthKeys, tenantMeQueryOptions } from "@/lib/api/tenant-auth";
import { Route } from "@/routes/club";

const tenantPrincipal = {
  userId: "user-1",
  tenantId: "tenant-1",
  sessionId: "session-1",
  systemRoles: [],
  tenantRoles: ["member"],
};

function getBeforeLoad() {
  return Route.options.beforeLoad as NonNullable<typeof Route.options.beforeLoad>;
}

describe("club route guard", () => {
  it("ensures tenant auth before loading the route", async () => {
    const ensureQueryData = vi.fn().mockResolvedValue(tenantPrincipal);
    const removeQueries = vi.fn();

    await getBeforeLoad()({
      context: {
        queryClient: {
          ensureQueryData,
          removeQueries,
        },
      },
      location: { href: "/club" },
    } as never);

    expect(ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: tenantMeQueryOptions().queryKey,
        retry: false,
      }),
    );
    expect(removeQueries).not.toHaveBeenCalled();
  });

  it("clears tenant auth and redirects unauthenticated users to club login", async () => {
    const ensureQueryData = vi
      .fn()
      .mockRejectedValue(
        new ApiClientError("Unauthorized", { code: "UNAUTHORIZED", status: 401 }),
      );
    const removeQueries = vi.fn();

    await expect(
      getBeforeLoad()({
        context: {
          queryClient: {
            ensureQueryData,
            removeQueries,
          },
        },
        location: { href: "/club/settings?tab=members" },
      } as never),
    ).rejects.toMatchObject({
      options: {
        to: "/club/login",
        search: {
          redirect: "/club/settings?tab=members",
        },
      },
    });

    expect(removeQueries).toHaveBeenCalledTimes(1);
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: tenantAuthKeys.me });
    expect(removeQueries).not.toHaveBeenCalledWith({ queryKey: authKeys.me });
  });

  it("re-throws non-auth errors", async () => {
    const error = new ApiClientError("Server error", { code: "SERVER_ERROR", status: 500 });
    const ensureQueryData = vi.fn().mockRejectedValue(error);
    const removeQueries = vi.fn();

    await expect(
      getBeforeLoad()({
        context: {
          queryClient: {
            ensureQueryData,
            removeQueries,
          },
        },
        location: { href: "/club" },
      } as never),
    ).rejects.toBe(error);

    expect(removeQueries).not.toHaveBeenCalled();
  });
});
