import type {
  AdminRoundsQueryDto,
  ApiErrorResponse,
  ApiOperationBody,
  ApiOperationData,
  ApiOperationQuery,
  ApiOperationResponse,
  ApiSuccessResponse,
  CreateTableResponseDataDto,
  FinishMatchResponseDataDto,
  UpdateProfileRequestDto,
} from "./index.js";

type Assert<T extends true> = T;
type IsAssignable<TValue, TExpected> = TValue extends TExpected ? true : false;

type ProfilePatchBody = ApiOperationBody<"PATCH /api/auth/me">;
type CreateTableData = ApiOperationData<"POST /api/admin/tables">;
type FinishMatchData = ApiOperationData<"POST /api/tables/:tableId/matches">;
type AdminRoundsBody = ApiOperationBody<"GET /api/admin/rounds">;
type AdminRoundsQuery = ApiOperationQuery<"GET /api/admin/rounds">;
type AdminRoundsResponse = ApiOperationResponse<"GET /api/admin/rounds">;

type _ProfilePatchBodyMatches = Assert<
  IsAssignable<ProfilePatchBody, UpdateProfileRequestDto>
>;
type _CreateTableDataMatches = Assert<
  IsAssignable<CreateTableData, CreateTableResponseDataDto>
>;
type _FinishMatchDataMatches = Assert<
  IsAssignable<FinishMatchData, FinishMatchResponseDataDto>
>;
type _AdminRoundsBodyIsEmpty = Assert<
  IsAssignable<AdminRoundsBody, Record<string, never>>
>;
type _AdminRoundsQueryMatches = Assert<
  IsAssignable<AdminRoundsQuery, AdminRoundsQueryDto>
>;
type _AdminRoundsResponseIsEnveloped = Assert<
  IsAssignable<
    AdminRoundsResponse,
    | ApiSuccessResponse<ApiOperationData<"GET /api/admin/rounds">>
    | ApiErrorResponse
  >
>;

const errorResponse: ApiOperationResponse<"POST /api/admin/tables"> = {
  ok: false,
  error: {
    status: 400,
    code: "invalid_request",
    message: "Request validation failed.",
    details: [],
    path: "/api/admin/tables",
    method: "POST",
    timestamp: "2026-05-07T00:00:00.000Z",
  },
};

const successResponse: ApiOperationResponse<"POST /api/admin/tables"> = {
  ok: true,
  data: {
    table: {
      id: "table_1",
      name: "Mesa principal",
    },
  },
  meta: {
    timestamp: "2026-05-07T00:00:00.000Z",
  },
};

const roundsQuery: AdminRoundsQueryDto = {
  page: "1",
  pageSize: "25",
  status: "rollback_available",
  kind: "match",
};

void errorResponse;
void successResponse;
void roundsQuery;

const rawCreateTableResponse: ApiOperationResponse<"POST /api/admin/tables"> = {
  // @ts-expect-error public HTTP responses must use the Nest success envelope.
  table: {
    id: "table_1",
    name: "Mesa principal",
  },
};

void rawCreateTableResponse;
