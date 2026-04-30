import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  getPageInfo,
  getPaginationOffset,
  parseApiPaginationParams,
  parseServerPaginationParams,
} from "@/lib/pagination";

describe("pagination helpers", () => {
  it("normalizes invalid server params to defaults", () => {
    expect(
      parseServerPaginationParams({ page: "abc", pageSize: "11" }),
    ).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    });
    expect(parseServerPaginationParams({ page: "0", pageSize: "100" })).toEqual(
      {
        page: DEFAULT_PAGE,
        pageSize: 100,
      },
    );
  });

  it("rejects invalid api params", () => {
    expect(parseApiPaginationParams(new URLSearchParams("page=0"))).toEqual({
      ok: false,
      error: "Parametro page invalido.",
    });
    expect(parseApiPaginationParams(new URLSearchParams("page=abc"))).toEqual({
      ok: false,
      error: "Parametro page invalido.",
    });
    expect(
      parseApiPaginationParams(new URLSearchParams("pageSize=20")),
    ).toEqual({
      ok: false,
      error: "Parametro pageSize invalido.",
    });
  });

  it("builds clamped page info and offsets", () => {
    const pageInfo = getPageInfo({ page: 9, pageSize: 25 }, 52);

    expect(pageInfo).toEqual({
      page: 3,
      pageSize: 25,
      totalCount: 52,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect(getPaginationOffset(pageInfo)).toBe(50);
  });
});
