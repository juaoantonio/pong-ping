import { ApiProperty } from "@nestjs/swagger";
import { SYSTEM_ROLES, TENANT_ROLES } from "../../identity-roles";

export class AuthSessionResponseDto {
  @ApiProperty({ example: "018f08f1-4f8c-72db-bf2f-497f2b8e623a" })
  sessionId!: string;
}

export class AuthLogoutResponseDto {
  @ApiProperty({ example: true })
  revoked!: true;
}

export class IdentityPrincipalResponseDto {
  @ApiProperty({ example: "018f08f1-5154-7687-9051-48b4cfa13f77" })
  userId!: string;

  @ApiProperty({
    nullable: true,
    example: "018f08f1-54a7-7181-8d75-59336a3a6e2b",
  })
  tenantId!: string | null;

  @ApiProperty({ example: "018f08f1-4f8c-72db-bf2f-497f2b8e623a" })
  sessionId!: string;

  @ApiProperty({ enum: SYSTEM_ROLES, isArray: true, example: ["system_admin"] })
  systemRoles!: string[];

  @ApiProperty({ enum: TENANT_ROLES, isArray: true, example: ["owner"] })
  tenantRoles!: string[];
}
