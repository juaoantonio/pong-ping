import { expect } from "vitest";

export function expectSuccessEnvelope(body: unknown) {
  expect(body).toEqual(
    expect.objectContaining({
      ok: true,
      data: expect.anything(),
      meta: expect.objectContaining({
        timestamp: expect.any(String),
      }),
    }),
  );
}

export function expectErrorEnvelope(body: unknown) {
  expect(body).toEqual(
    expect.objectContaining({
      ok: false,
      error: expect.objectContaining({
        status: expect.any(Number),
        code: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
      }),
    }),
  );
}
