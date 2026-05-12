import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CurrentContextService } from "../../../common/context";
import { IDENTITY_EVENT } from "../../../common/events/identity.events";
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
    private readonly eventEmitter: EventEmitter2,
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

    await this.eventEmitter.emitAsync(IDENTITY_EVENT.TENANT_USER_AUTHENTICATED, {
      tenantId: tenant.id,
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      occurredAt: new Date(),
    });

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
      return this.updateExistingGoogleUser(existingBySubject, profile, email);
    }

    const existingByEmail = await this.users.findOne({ where: { email } });

    if (existingByEmail) {
      return this.linkPendingGoogleUser(existingByEmail, profile);
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

  private async updateExistingGoogleUser(
    user: IdentityUserEntity,
    profile: GoogleProfile,
    email: string,
  ): Promise<IdentityUserEntity> {
    if (user.email !== email) {
      const emailCollision = await this.users.findOne({ where: { email } });
      if (emailCollision && emailCollision.id !== user.id) {
        throw new ConflictException("Email is already linked to another Google account.");
      }
    }

    user.email = email;
    user.displayName = profile.displayName;
    user.avatarUrl = profile.avatarUrl;
    return this.users.save(user);
  }

  private async linkPendingGoogleUser(
    user: IdentityUserEntity,
    profile: GoogleProfile,
  ): Promise<IdentityUserEntity> {
    if (user.googleSubject !== null) {
      throw new ConflictException("Email is already linked to another Google account.");
    }

    user.googleSubject = profile.googleSubject;
    user.displayName = profile.displayName;
    user.avatarUrl = profile.avatarUrl;
    user.active = true;
    return this.users.save(user);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
