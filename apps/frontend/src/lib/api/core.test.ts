import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCoreDashboard, getCurrentCoreClub, listCoreTables } from "@/lib/api/core";

function mockResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("core api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses tenant-scoped paths without the legacy core prefix", async () => {
    const fetchMock = vi.mocked(fetch);
    const meta = { timestamp: "2026-05-20T09:00:00.000Z" };
    fetchMock
      .mockResolvedValueOnce(mockResponse({ ok: true, data: {}, meta }))
      .mockResolvedValueOnce(mockResponse({ ok: true, data: { id: "club-1" }, meta }))
      .mockResolvedValueOnce(
        mockResponse({ ok: true, data: { items: [], page: {} }, meta }),
      );

    await getCoreDashboard();
    await getCurrentCoreClub();
    await listCoreTables({ page: 2, pageSize: 10 });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://api.localhost.me:3001/v1/dashboard",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://api.localhost.me:3001/v1/club",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://api.localhost.me:3001/v1/tables?page=2&pageSize=10",
      expect.any(Object),
    );
  });
});
