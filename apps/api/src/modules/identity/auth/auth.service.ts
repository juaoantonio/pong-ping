import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CurrentContextService } from "../../../common/context";
import { IdentityUserEntity, TenantMembershipEntity } from "../entities";
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
  ) {}

  public async completeGoogleLogin(
    profile: GoogleProfile,
    requestInfo: { userAgent?: string; ipAddress?: string },
  ): Promise<CreatedSession> {
    const tenant = this.context.getTenantOrThrow();
    const user = await this.upsertGoogleUser(profile);
    const membership = await this.memberships.findOne({
      where: { tenantId: tenant.id, userId: user.id, active: true },
    });

    if (!membership) {
      throw new ForbiddenException("User is not a member of this tenant.");
    }

    return this.sessions.createSession({
      userId: user.id,
      tenantId: tenant.id,
      userAgent: requestInfo.userAgent,
      ipAddress: requestInfo.ipAddress,
    });
  }

  public async getMe() {
    return this.context.getPrincipalOrThrow();
  }

  private async upsertGoogleUser(profile: GoogleProfile): Promise<IdentityUserEntity> {
    const existingBySubject = await this.users.findOne({
      where: { googleSubject: profile.googleSubject },
    });

    if (existingBySubject) {
      existingBySubject.email = profile.email;
      existingBySubject.displayName = profile.displayName;
      existingBySubject.avatarUrl = profile.avatarUrl;
      return this.users.save(existingBySubject);
    }

    const existingByEmail = await this.users.findOne({ where: { email: profile.email } });
    if (existingByEmail) {
      throw new ConflictException("Email is already linked to another Google account.");
    }

    return this.users.save(
      this.users.create({
        googleSubject: profile.googleSubject,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        active: true,
      }),
    );
  }
}
