import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CurrentContextService } from "../../../common/context";
import {
  IdentityUserEntity,
  SystemRoleAssignmentEntity,
  TenantMembershipEntity,
  TenantEntity,
} from "../entities";
import { IDENTITY_SYSTEM_ROLE } from "../identity-roles";
import { SessionService, type CreatedSession } from "../session/session.service";
import type { GoogleProfile } from "./google-profile";

@Injectable()
export class AuthService {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly sessions: SessionService,
    @InjectRepository(IdentityUserEntity)
    private readonly users: Repository<IdentityUserEntity>,
    @InjectRepository(TenantMembershipEntity)
    private readonly memberships: Repository<TenantMembershipEntity>,
    @InjectRepository(SystemRoleAssignmentEntity)
    private readonly systemRoles: Repository<SystemRoleAssignmentEntity>,
  ) {}

  public async completeGoogleLogin(
    profile: GoogleProfile,
    requestInfo: { userAgent?: string; ipAddress?: string },
  ): Promise<CreatedSession> {
    const tenant = this.context.getTenantOrThrow();
    return this.completeGoogleLoginForTenant(
      profile,
      { id: tenant.id } as TenantEntity,
      requestInfo,
    );
  }

  public async completeGoogleLoginForTenant(
    profile: GoogleProfile,
    tenant: Pick<TenantEntity, "id">,
    requestInfo: { userAgent?: string; ipAddress?: string },
  ): Promise<CreatedSession> {
    const user = await this.upsertGoogleUser(profile);
    const membership = await this.memberships.findOne({
      where: { tenantId: tenant.id, userId: user.id, active: true },
    });

    if (!membership) {
      throw new ForbiddenException("User is not a member of this tenant.");
    }

    return this.sessions.createTenantSession({
      userId: user.id,
      tenantId: tenant.id,
      userAgent: requestInfo.userAgent,
      ipAddress: requestInfo.ipAddress,
    });
  }

  public async completeSystemGoogleLogin(
    profile: GoogleProfile,
    requestInfo: { userAgent?: string; ipAddress?: string },
  ): Promise<CreatedSession> {
    const user = await this.upsertGoogleUser(profile);
    const systemRole = await this.systemRoles.findOne({
      where: { userId: user.id, role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN },
    });

    if (!systemRole) {
      throw new ForbiddenException("System administrator role is required.");
    }

    return this.sessions.createSystemSession({
      userId: user.id,
      userAgent: requestInfo.userAgent,
      ipAddress: requestInfo.ipAddress,
    });
  }

  public async getMe() {
    return this.context.getPrincipalOrThrow();
  }

  private async upsertGoogleUser(profile: GoogleProfile): Promise<IdentityUserEntity> {
    const email = normalizeEmail(profile.email);
    const existingBySubject = await this.users.findOne({
      where: { googleSubject: profile.googleSubject },
    });

    if (existingBySubject) {
      if (existingBySubject.email !== email) {
        const existingByEmail = await this.users.findOne({ where: { email } });
        if (existingByEmail && existingByEmail.id !== existingBySubject.id) {
          throw new ConflictException("Email is already linked to another Google account.");
        }
      }

      existingBySubject.email = email;
      existingBySubject.displayName = profile.displayName;
      existingBySubject.avatarUrl = profile.avatarUrl;
      return this.users.save(existingBySubject);
    }

    const existingByEmail = await this.users.findOne({ where: { email } });
    if (existingByEmail) {
      if (existingByEmail.googleSubject !== null) {
        throw new ConflictException("Email is already linked to another Google account.");
      }

      existingByEmail.googleSubject = profile.googleSubject;
      existingByEmail.displayName = profile.displayName;
      existingByEmail.avatarUrl = profile.avatarUrl;
      existingByEmail.active = true;
      return this.users.save(existingByEmail);
    }

    return this.users.save(
      this.users.create({
        googleSubject: profile.googleSubject,
        email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        active: true,
      }),
    );
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
