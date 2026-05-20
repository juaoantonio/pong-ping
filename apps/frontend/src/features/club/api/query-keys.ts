import type { CorePageRequestContract } from "@pong-ping/contracts";

export const coreQueryKeys = {
  all: ["core"] as const,
  dashboard: () => [...coreQueryKeys.all, "dashboard"] as const,
  tables: {
    all: () => [...coreQueryKeys.all, "tables"] as const,
    detail: (tableId: string) => [...coreQueryKeys.tables.all(), "detail", tableId] as const,
    list: (params: CorePageRequestContract = {}) =>
      [...coreQueryKeys.tables.all(), "list", params] as const,
  },
  athletes: {
    all: () => [...coreQueryKeys.all, "athletes"] as const,
    list: (params: CorePageRequestContract = {}) =>
      [...coreQueryKeys.athletes.all(), "list", params] as const,
    me: () => [...coreQueryKeys.athletes.all(), "me"] as const,
  },
  ratings: {
    all: () => [...coreQueryKeys.all, "ratings"] as const,
    list: (params: CorePageRequestContract = {}) =>
      [...coreQueryKeys.ratings.all(), "list", params] as const,
  },
  games: {
    all: () => [...coreQueryKeys.all, "games"] as const,
    detail: (gameRecordId: string) => [...coreQueryKeys.games.all(), "detail", gameRecordId] as const,
    list: (params: CorePageRequestContract = {}) =>
      [...coreQueryKeys.games.all(), "list", params] as const,
  },
};
