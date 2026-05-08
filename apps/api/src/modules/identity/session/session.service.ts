import { createHmac, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import type { ConfigSchema } from "../../../common/config/config.module";
import type { IdentityPrincipal } from "../../../common/context";
import {
  IdentitySessionEntity,
  IdentityUserEntity,
  SystemRoleAssignmentEntity,
  TenantMembershipEntity,
} from "../entities";
import { IDENTITY_SYSTEM_ROLE } from "../identity-roles";
import { SESSION_VALIDATION_FAILURE, SessionValidationError } from "./session-validation.error";

export type CreatedSession = {
  session: IdentitySessionEntity;
  token: string;
};

type CreateSessionRecordInput = {
  userId: string;
  tenantId: string | null;
  userAgent?: string;
  ipAddress?: string;
};

type CreateTenantSessionInput = Omit<CreateSessionRecordInput, "tenantId"> & {
  tenantId: string;
};

@Injectable()
export class SessionService {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    @InjectRepository(IdentitySessionEntity)
    private readonly sessions: Repository<IdentitySessionEntity>,
    @InjectRepository(IdentityUserEntity)
    private readonly users: Repository<IdentityUserEntity>,
    @InjectRepository(TenantMembershipEntity)
    private readonly memberships: Repository<TenantMembershipEntity>,
    @InjectRepository(SystemRoleAssignmentEntity)
    private readonly systemRoles: Repository<SystemRoleAssignmentEntity>,
  ) {}

  public async createSession(input: CreateTenantSessionInput): Promise<CreatedSession> {
    return this.createTenantSession(input);
  }

  public async createTenantSession(input: CreateTenantSessionInput): Promise<CreatedSession> {
    return this.createSessionRecord(input);
  }

  public async createSystemSession(
    input: Omit<CreateSessionRecordInput, "tenantId">,
  ): Promise<CreatedSession> {
    return this.createSessionRecord({ ...input, tenantId: null });
  }

  private async createSessionRecord(input: CreateSessionRecordInput): Promise<CreatedSession> {
    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const ttlSeconds = this.config.getOrThrow<number>("SESSION_TTL_SECONDS");
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const session = this.sessions.create({
      tokenHash: this.hashToken(token),
      userId: input.userId,
      tenantId: input.tenantId,
      expiresAt,
      revokedAt: null,
      lastUsedAt: now,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
    });

    return { session: await this.sessions.save(session), token };
  }

  public async validateSession(
    rawToken: string | undefined,
    tenantId: string,
  ): Promise<IdentityPrincipal> {
    return this.validateTenantSession(rawToken, tenantId);
  }

  public async validateTenantSession(
    rawToken: string | undefined,
    tenantId: string,
  ): Promise<IdentityPrincipal> {
    if (!rawToken) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Missing);
    }

    const session = await this.findLiveSession(rawToken);
    if (session.tenantId !== tenantId) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.TenantMismatch);
    }

    if (!session.tenant?.active) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.InactiveTenant);
    }

    const membership = await this.memberships.findOne({
      where: { tenantId, userId: session.userId, active: true },
    });

    if (!membership) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.InactiveMembership);
    }

    const systemRoles = await this.systemRoles.find({
      where: { userId: session.userId },
    });

    await this.touchSession(session);

    return {
      userId: session.userId,
      tenantId,
      systemRoles: systemRoles.map((assignment) => assignment.role),
      tenantRoles: membership.roles,
      sessionId: session.id,
    };
  }

  public async validateSystemSession(rawToken: string | undefined): Promise<IdentityPrincipal> {
    if (!rawToken) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Missing);
    }

    const session = await this.findLiveSession(rawToken);
    if (session.tenantId !== null) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.TenantMismatch);
    }

    const systemRoles = await this.systemRoles.find({
      where: { userId: session.userId },
    });
    if (!systemRoles.some((assignment) => assignment.role === IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN)) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.InactiveMembership);
    }

    await this.touchSession(session);

    return {
      userId: session.userId,
      tenantId: null,
      systemRoles: systemRoles.map((assignment) => assignment.role),
      tenantRoles: [],
      sessionId: session.id,
    };
  }

  public async revokeSession(sessionId: string): Promise<void> {
    await this.sessions.update({ id: sessionId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  public async revokeToken(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;

    await this.sessions.update(
      { tokenHash: this.hashToken(rawToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  public hashToken(rawToken: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("SESSION_SECRET"))
      .update(rawToken)
      .digest("hex");
  }

  private async findLiveSession(rawToken: string): Promise<IdentitySessionEntity> {
    const session = await this.sessions.findOne({
      where: {
        tokenHash: this.hashToken(rawToken),
      },
      relations: { tenant: true, user: true },
    });

    if (!session) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Unknown);
    }

    if (session.revokedAt) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Revoked);
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Expired);
    }

    if (!session.user?.active) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.InactiveUser);
    }

    return session;
  }

  private async touchSession(session: IdentitySessionEntity): Promise<void> {
    session.lastUsedAt = new Date();
    await this.sessions.save(session);
  }
}
