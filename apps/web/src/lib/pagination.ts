export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export type PaginationInput = {
  page: number;
  pageSize: PageSize;
};

export type PageInfo = PaginationInput & {
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type SearchParamValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamValue>;

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function integerFromParam(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function isPageSize(value: number): value is PageSize {
  return PAGE_SIZE_OPTIONS.includes(value as PageSize);
}

export function getPaginationOffset({ page, pageSize }: PaginationInput) {
  return (page - 1) * pageSize;
}

export function getPageInfo(
  input: PaginationInput,
  totalCount: number,
): PageInfo {
  const totalPages = Math.max(1, Math.ceil(totalCount / input.pageSize));
  const page = Math.min(Math.max(input.page, 1), totalPages);

  return {
    page,
    pageSize: input.pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export function parseServerPaginationParams(
  params: SearchParamsRecord,
): PaginationInput {
  const page = integerFromParam(firstParam(params.page)) ?? DEFAULT_PAGE;
  const pageSize =
    integerFromParam(firstParam(params.pageSize)) ?? DEFAULT_PAGE_SIZE;

  return {
    page: page > 0 ? page : DEFAULT_PAGE,
    pageSize: isPageSize(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  };
}

export function parseApiPaginationParams(searchParams: URLSearchParams):
  | {
      ok: true;
      pagination: PaginationInput;
    }
  | {
      ok: false;
      error: string;
    } {
  const pageValue = searchParams.get("page");
  const pageSizeValue = searchParams.get("pageSize");
  const page = integerFromParam(pageValue ?? undefined);
  const pageSize = integerFromParam(pageSizeValue ?? undefined);

  if (pageValue !== null && (page === null || page < 1)) {
    return { ok: false, error: "Parametro page invalido." };
  }

  if (pageSizeValue !== null && (pageSize === null || !isPageSize(pageSize))) {
    return { ok: false, error: "Parametro pageSize invalido." };
  }

  const normalizedPageSize: PageSize =
    pageSize !== null && isPageSize(pageSize) ? pageSize : DEFAULT_PAGE_SIZE;

  return {
    ok: true,
    pagination: {
      page: page ?? DEFAULT_PAGE,
      pageSize: normalizedPageSize,
    },
  };
}
