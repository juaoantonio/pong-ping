import { Controller, Get, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { CorePageQueryDto } from "../shared/presentation/http/dtos/core-page.dtos";
import { TableResponseDto } from "./presentation/http/dtos/table-command.dtos";
import { TableReadQuery } from "./presentation/http/queries/table-read.query";

@ApiTags("tables")
@Controller("tables")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class TableReadController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly query: TableReadQuery,
  ) {}

  @Get()
  @ApiOperation({ summary: "List tables for the current core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Tables listed.",
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
  )
  public async list(@Query() page: CorePageQueryDto) {
    const tenant = this.context.getTenantOrThrow();

    return this.query.listTables(tenant.id, page);
  }

  @Get(":tableId")
  @ApiOperation({ summary: "Get table detail for the current core club" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Table detail.",
    data: TableResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Table was not found." },
  )
  public async detail(@Param("tableId") tableId: string) {
    const tenant = this.context.getTenantOrThrow();

    return this.query.getTableDetail(tenant.id, tableId);
  }
}
