import type {
  AthleteResponseContract,
  ClubResponseContract,
  CoreDashboardSummaryContract,
  CorePageRequestContract,
  CorePageResponseContract,
  CreateTableRequestContract,
  GameRecordResponseContract,
  RatingReadContract,
  RenameTableRequestContract,
  TableActiveGameCommandResponseContract,
  TableQueueEntryCommandResponseContract,
  TableResponseContract,
  UpdateAthleteProfileRequestContract,
  WinningAthletesRequestContract,
} from "@pong-ping/contracts";
import { apiRequest } from "@/lib/api/client";
import { getTenantApiBaseUrl } from "@/lib/api/tenant-auth";

function tenantRequest<TData, TBody = never>(path: string, options = {}) {
  return apiRequest<TData, TBody>(path, {
    baseUrl: getTenantApiBaseUrl(),
    ...options,
  });
}

function pageSearch(params: CorePageRequestContract = {}) {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getCoreDashboard() {
  return tenantRequest<CoreDashboardSummaryContract>("/dashboard");
}

export function getCurrentCoreClub() {
  return tenantRequest<ClubResponseContract>("/club");
}

export function listCoreTables(params?: CorePageRequestContract) {
  return tenantRequest<CorePageResponseContract<TableResponseContract>>(
    `/tables${pageSearch(params)}`,
  );
}

export function getCoreTable(tableId: string) {
  return tenantRequest<TableResponseContract>(`/tables/${encodeURIComponent(tableId)}`);
}

export function createCoreTable(input: CreateTableRequestContract) {
  return tenantRequest<TableResponseContract, CreateTableRequestContract>("/tables", {
    method: "POST",
    body: input,
  });
}

export function renameCoreTable(tableId: string, input: RenameTableRequestContract) {
  return tenantRequest<TableResponseContract, RenameTableRequestContract>(
    `/tables/${encodeURIComponent(tableId)}/name`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export function enqueueCoreTable(tableId: string) {
  return tenantRequest<TableQueueEntryCommandResponseContract>(
    `/tables/${encodeURIComponent(tableId)}/queue`,
    { method: "POST" },
  );
}

export function removeCoreQueuedAthlete(tableId: string, athleteId: string) {
  return tenantRequest<TableQueueEntryCommandResponseContract>(
    `/tables/${encodeURIComponent(tableId)}/queue/${encodeURIComponent(athleteId)}`,
    { method: "DELETE" },
  );
}

export function removeCoreActiveAthlete(tableId: string, athleteId: string) {
  return tenantRequest<TableQueueEntryCommandResponseContract>(
    `/tables/${encodeURIComponent(tableId)}/active-game/${encodeURIComponent(athleteId)}`,
    { method: "DELETE" },
  );
}

export function formCoreActiveGame(tableId: string) {
  return tenantRequest<TableActiveGameCommandResponseContract>(
    `/tables/${encodeURIComponent(tableId)}/active-game`,
    { method: "POST" },
  );
}

export function rotateCoreWinnerStays(tableId: string, input: WinningAthletesRequestContract) {
  return tenantRequest<TableActiveGameCommandResponseContract, WinningAthletesRequestContract>(
    `/tables/${encodeURIComponent(tableId)}/rotate-winner-stays`,
    {
      method: "POST",
      body: input,
    },
  );
}

export function getCurrentCoreAthlete() {
  return tenantRequest<AthleteResponseContract>("/athletes/me");
}

export function listCoreAthletes(params?: CorePageRequestContract) {
  return tenantRequest<CorePageResponseContract<AthleteResponseContract>>(
    `/athletes${pageSearch(params)}`,
  );
}

export function updateCoreAthleteProfile(
  athleteId: string,
  input: UpdateAthleteProfileRequestContract,
) {
  return tenantRequest<AthleteResponseContract, UpdateAthleteProfileRequestContract>(
    `/athletes/${encodeURIComponent(athleteId)}/profile`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export function listCoreRatings(params?: CorePageRequestContract) {
  return tenantRequest<CorePageResponseContract<RatingReadContract>>(
    `/ratings${pageSearch(params)}`,
  );
}

export function listCoreGames(params?: CorePageRequestContract) {
  return tenantRequest<CorePageResponseContract<GameRecordResponseContract>>(
    `/games${pageSearch(params)}`,
  );
}

export function getCoreGame(gameRecordId: string) {
  return tenantRequest<GameRecordResponseContract>(`/games/${encodeURIComponent(gameRecordId)}`);
}

export function recordCoreGame(tableId: string, input: WinningAthletesRequestContract) {
  return tenantRequest<GameRecordResponseContract, WinningAthletesRequestContract>(
    `/tables/${encodeURIComponent(tableId)}/games`,
    {
      method: "POST",
      body: input,
    },
  );
}

export function correctCoreGame(gameRecordId: string) {
  return tenantRequest<GameRecordResponseContract>(
    `/games/${encodeURIComponent(gameRecordId)}/corrections`,
    { method: "POST" },
  );
}
