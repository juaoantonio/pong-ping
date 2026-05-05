import { fail, ok, type DomainError } from "@/lib/contexts/shared";

describe("domain result helpers", () => {
  it("wraps successful values", () => {
    expect(ok({ id: "table-1" })).toEqual({
      ok: true,
      value: { id: "table-1" },
    });
  });

  it("wraps typed domain errors with stable context and code", () => {
    type TablePlayError = DomainError<"table_not_found">;

    const error: TablePlayError = {
      context: "table-play",
      code: "table_not_found",
      message: "Mesa nao encontrada.",
    };

    expect(fail(error)).toEqual({ ok: false, error });
  });
});
