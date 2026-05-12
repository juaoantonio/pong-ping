import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { ApiParseError } from "@/lib/api/errors";

function mockResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success envelope data and includes credentials", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: { id: "tenant-1" },
        meta: { timestamp: "2026-05-08T20:00:00.000Z" },
      }),
    );

    await expect(
      apiRequest<{ id: string }>("/system/admin/tenants"),
    ).resolves.toEqual({
      id: "tenant-1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.localhost.me:3001/v1/system/admin/tenants",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("serializes request bodies as json", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: { created: true },
        meta: { timestamp: "2026-05-08T20:00:00.000Z" },
      }),
    );

    await apiRequest<{ created: true }, { name: string }>(
      "/system/admin/tenants",
      {
        body: { name: "Downtown" },
        method: "POST",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ name: "Downtown" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        method: "POST",
      }),
    );
  });

  it("throws API envelope errors", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        {
          ok: false,
          error: {
            status: 409,
            code: "CONFLICT",
            message: "Tenant slug is already in use.",
            details: [],
          },
        },
        { status: 409 },
      ),
    );

    await expect(apiRequest("/system/admin/tenants")).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Tenant slug is already in use.",
      status: 409,
    });
  });

  it("throws parse errors for malformed success envelopes", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { id: "tenant-1" } }));

    await expect(apiRequest("/system/admin/tenants")).rejects.toBeInstanceOf(
      ApiParseError,
    );
  });
});
