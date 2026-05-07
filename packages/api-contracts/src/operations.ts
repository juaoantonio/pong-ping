import type {
  ChangeUserRoleRequestDto,
  ChangeUserRoleResponseDataDto,
  CreateAdminAccessRequestDto,
  CreateAdminAccessResponseDataDto,
  CreateTenantRequestDto,
  CreateTenantResponseDataDto,
  ListAdminAccessResponseDataDto,
  ListAdminTenantsResponseDataDto,
  ListAdminUsersResponseDataDto,
  UserIdParamsDto,
} from "./admin.js";
import type {
  AuthMeResponseDataDto,
  LogoutResponseDataDto,
} from "./auth.js";
import type {
  AdminRoundsQueryDto,
  FinishMatchRequestDto,
  FinishMatchResponseDataDto,
  ListAdminRoundsResponseDataDto,
  RollbackMatchResponseDataDto,
  RoundParamsDto,
} from "./competition.js";
import type {
  ClaimAccessInvitationParamsDto,
  ClaimAccessInvitationRequestDto,
  ClaimAccessInvitationResponseDataDto,
} from "./invitations.js";
import type {
  ProfileResponseDataDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDataDto,
} from "./profile.js";
import type { PublicRankingsResponseDataDto } from "./rankings.js";
import type { ScoreboardResponseDataDto } from "./scoreboard.js";
import type {
  ApiResponse,
  EmptyBody,
  EmptyParams,
  EmptyQuery,
  OkResponseDataDto,
  PaginationQueryDto,
} from "./shared.js";
import type {
  AddTableParticipantRequestDto,
  CreateTableInvitationResponseDataDto,
  CreateTableRequestDto,
  CreateTableResponseDataDto,
  DeleteTableResponseDataDto,
  JoinTableByTokenParamsDto,
  JoinTableByTokenResponseDataDto,
  ListTablesResponseDataDto,
  MatchParamsDto,
  ParticipantParamsDto,
  QueueTableResponseDataDto,
  TableDetailResponseDataDto,
  TableIdParamsDto,
  TableInvitationRequestDto,
} from "./tables.js";

export interface ApiOperationContract<
  TParams = EmptyParams,
  TQuery = EmptyQuery,
  TBody = EmptyBody,
  TData = unknown,
> {
  params: TParams;
  query: TQuery;
  body: TBody;
  data: TData;
  response: ApiResponse<TData>;
}

export type ApiOperationMap = {
  "GET /api/auth/me": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    EmptyBody,
    AuthMeResponseDataDto
  >;
  "PATCH /api/auth/me": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    UpdateProfileRequestDto,
    UpdateProfileResponseDataDto
  >;
  "POST /api/auth/logout": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    EmptyBody,
    LogoutResponseDataDto
  >;
  "GET /api/admin/access": ApiOperationContract<
    EmptyParams,
    PaginationQueryDto,
    EmptyBody,
    ListAdminAccessResponseDataDto
  >;
  "POST /api/admin/access": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    CreateAdminAccessRequestDto,
    CreateAdminAccessResponseDataDto
  >;
  "GET /api/admin/tenants": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    EmptyBody,
    ListAdminTenantsResponseDataDto
  >;
  "POST /api/admin/tenants": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    CreateTenantRequestDto,
    CreateTenantResponseDataDto
  >;
  "GET /api/admin/users": ApiOperationContract<
    EmptyParams,
    PaginationQueryDto,
    EmptyBody,
    ListAdminUsersResponseDataDto
  >;
  "DELETE /api/admin/users/:id": ApiOperationContract<
    UserIdParamsDto,
    EmptyQuery,
    EmptyBody,
    OkResponseDataDto
  >;
  "PATCH /api/admin/users/:id/role": ApiOperationContract<
    UserIdParamsDto,
    EmptyQuery,
    ChangeUserRoleRequestDto,
    ChangeUserRoleResponseDataDto
  >;
  "GET /api/admin/rounds": ApiOperationContract<
    EmptyParams,
    AdminRoundsQueryDto,
    EmptyBody,
    ListAdminRoundsResponseDataDto
  >;
  "POST /api/admin/rounds/:roundId/rollback": ApiOperationContract<
    RoundParamsDto,
    EmptyQuery,
    EmptyBody,
    RollbackMatchResponseDataDto
  >;
  "POST /api/admin/tables": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    CreateTableRequestDto,
    CreateTableResponseDataDto
  >;
  "DELETE /api/admin/tables/:tableId": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    EmptyBody,
    DeleteTableResponseDataDto
  >;
  "POST /api/admin/tables/:tableId/invites": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    TableInvitationRequestDto,
    CreateTableInvitationResponseDataDto
  >;
  "POST /api/admin/tables/:tableId/participants": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    AddTableParticipantRequestDto,
    OkResponseDataDto
  >;
  "DELETE /api/admin/tables/:tableId/participants/:participantId": ApiOperationContract<
    ParticipantParamsDto,
    EmptyQuery,
    EmptyBody,
    OkResponseDataDto
  >;
  "POST /api/admin/tables/:tableId/matches": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    FinishMatchRequestDto,
    FinishMatchResponseDataDto
  >;
  "POST /api/admin/tables/:tableId/matches/:matchId/rollback": ApiOperationContract<
    MatchParamsDto,
    EmptyQuery,
    EmptyBody,
    RollbackMatchResponseDataDto
  >;
  "GET /api/tables": ApiOperationContract<
    EmptyParams,
    PaginationQueryDto,
    EmptyBody,
    ListTablesResponseDataDto
  >;
  "GET /api/tables/:tableId": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    EmptyBody,
    TableDetailResponseDataDto
  >;
  "POST /api/tables/:tableId/queue": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    EmptyBody,
    QueueTableResponseDataDto
  >;
  "DELETE /api/tables/:tableId/queue": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    EmptyBody,
    OkResponseDataDto
  >;
  "DELETE /api/tables/:tableId/seat": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    EmptyBody,
    OkResponseDataDto
  >;
  "POST /api/tables/:tableId/matches": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    FinishMatchRequestDto,
    FinishMatchResponseDataDto
  >;
  "POST /api/tables/join/:token": ApiOperationContract<
    JoinTableByTokenParamsDto,
    EmptyQuery,
    EmptyBody,
    JoinTableByTokenResponseDataDto
  >;
  "POST /api/invitations/:token": ApiOperationContract<
    ClaimAccessInvitationParamsDto,
    EmptyQuery,
    ClaimAccessInvitationRequestDto,
    ClaimAccessInvitationResponseDataDto
  >;
  "GET /api/rankings": ApiOperationContract<
    EmptyParams,
    PaginationQueryDto,
    EmptyBody,
    PublicRankingsResponseDataDto
  >;
  "GET /api/profile": ApiOperationContract<
    EmptyParams,
    EmptyQuery,
    EmptyBody,
    ProfileResponseDataDto
  >;
  "GET /api/tables/:tableId/scoreboard": ApiOperationContract<
    TableIdParamsDto,
    EmptyQuery,
    EmptyBody,
    ScoreboardResponseDataDto
  >;
};

export type ApiOperation = keyof ApiOperationMap;
export type ApiOperationParams<TOperation extends ApiOperation> =
  ApiOperationMap[TOperation]["params"];
export type ApiOperationQuery<TOperation extends ApiOperation> =
  ApiOperationMap[TOperation]["query"];
export type ApiOperationBody<TOperation extends ApiOperation> =
  ApiOperationMap[TOperation]["body"];
export type ApiOperationData<TOperation extends ApiOperation> =
  ApiOperationMap[TOperation]["data"];
export type ApiOperationResponse<TOperation extends ApiOperation> =
  ApiOperationMap[TOperation]["response"];
