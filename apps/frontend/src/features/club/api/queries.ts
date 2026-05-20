import { useQuery } from "@tanstack/react-query";
import type { CorePageRequestContract } from "@pong-ping/contracts";
import {
  getCoreDashboard,
  getCoreTable,
  getCurrentCoreAthlete,
  listCoreAthletes,
  listCoreGames,
  listCoreRatings,
  listCoreTables,
} from "@/lib/api/core";
import { coreQueryKeys } from "@/features/club/api/query-keys";

export function useCoreDashboardQuery() {
  return useQuery({
    queryKey: coreQueryKeys.dashboard(),
    queryFn: getCoreDashboard,
  });
}

export function useCoreTablesQuery(params: CorePageRequestContract = {}) {
  return useQuery({
    queryKey: coreQueryKeys.tables.list(params),
    queryFn: () => listCoreTables(params),
  });
}

export function useCoreTableQuery(tableId: string) {
  return useQuery({
    enabled: tableId.length > 0,
    queryKey: coreQueryKeys.tables.detail(tableId),
    queryFn: () => getCoreTable(tableId),
  });
}

export function useCurrentCoreAthleteQuery() {
  return useQuery({
    queryKey: coreQueryKeys.athletes.me(),
    queryFn: getCurrentCoreAthlete,
  });
}

export function useCoreAthletesQuery(params: CorePageRequestContract = {}) {
  return useQuery({
    queryKey: coreQueryKeys.athletes.list(params),
    queryFn: () => listCoreAthletes(params),
  });
}

export function useCoreRatingsQuery(params: CorePageRequestContract = {}) {
  return useQuery({
    queryKey: coreQueryKeys.ratings.list(params),
    queryFn: () => listCoreRatings(params),
  });
}

export function useCoreGamesQuery(params: CorePageRequestContract = {}) {
  return useQuery({
    queryKey: coreQueryKeys.games.list(params),
    queryFn: () => listCoreGames(params),
  });
}
