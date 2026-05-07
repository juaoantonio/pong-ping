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
import {
  SESSION_VALIDATION_FAILURE,
  SessionValidationError,
} from "./session-validation.error";

export type CreatedSession = {
  session: IdentitySessionEntity;
  token: string;
};

type CreateSessionInput = {
  userId: string;
  tenantId: string;
  userAgent?: string;
  ipAddress?: string;
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

  public async createSession(input: CreateSessionInput): Promise<CreatedSession> {
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

  public async validateSession(rawToken: string | undefined, tenantId: string): Promise<IdentityPrincipal> {
    if (!rawToken) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Missing);
    }

    const session = await this.sessions.findOne({
      where: {
        tokenHash: this.hashToken(rawToken),
      },
      relations: { tenant: true, user: true },
    });

    if (!session) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.Unknown);
    }

    if (session.tenantId !== tenantId) {
      throw new SessionValidationError(SESSION_VALIDATION_FAILURE.TenantMismatch);
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

    session.lastUsedAt = new Date();
    await this.sessions.save(session);

    return {
      userId: session.userId,
      tenantId,
      systemRoles: systemRoles.map((assignment) => assignment.role),
      tenantRoles: membership.roles,
      sessionId: session.id,
    };
  }

  public async revokeSession(sessionId: string): Promise<void> {
    await this.sessions.update(
      { id: sessionId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
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
}
