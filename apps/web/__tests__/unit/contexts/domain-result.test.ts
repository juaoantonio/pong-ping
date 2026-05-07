import { fail, ok, type DomainError } from "@/lib/contexts/shared";

describe("helpers de resultado de dominio", () => {
  it("encapsula valores de sucesso", () => {
    expect(ok({ id: "table-1" })).toEqual({
      ok: true,
      value: { id: "table-1" },
    });
  });

  it("encapsula erros de dominio tipados com contexto e codigo estaveis", () => {
    type TablePlayError = DomainError<"table_not_found">;

    const error: TablePlayError = {
      context: "table-play",
      code: "table_not_found",
      message: "Mesa nao encontrada.",
    };

    expect(fail(error)).toEqual({ ok: false, error });
  });
});
