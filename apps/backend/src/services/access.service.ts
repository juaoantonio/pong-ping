import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AllowedEmail, AuditLog, AuthInvitation } from "../entities";
import {
  createId,
  createInvitationToken,
  getInvitationExpiry,
  hashInvitationToken,
  isInvitationExpiryPreset,
  isValidEmail,
  normalizeEmail,
} from "../domain/rules";
import { badRequest } from "../shared/http-error";

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(AllowedEmail)
    private readonly allowedEmails: Repository<AllowedEmail>,
    @InjectRepository(AuthInvitation)
    private readonly invitations: Repository<AuthInvitation>,
    private readonly config: ConfigService,
  ) {}

  async list() {
    const [allowedEmails, invitations] = await Promise.all([
      this.allowedEmails.find({
        relations: { createdBy: true },
        order: { createdAt: "DESC" },
      }),
      this.invitations.find({
        order: { createdAt: "DESC" },
        take: 10,
      }),
    ]);

    const now = Date.now();
    return {
      allowedEmails: allowedEmails.map((allowedEmail) => ({
        id: allowedEmail.id,
        email: allowedEmail.email,
        createdAt: allowedEmail.createdAt.toISOString(),
        createdBy: allowedEmail.createdBy
          ? {
              name: allowedEmail.createdBy.name,
              email: allowedEmail.createdBy.email,
            }
          : null,
      })),
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        expiresAt: invitation.expiresAt.toISOString(),
        oneTimeUse: invitation.oneTimeUse,
        usedAt: invitation.usedAt?.toISOString() ?? null,
        usedByEmail: invitation.usedByEmail,
        createdAt: invitation.createdAt.toISOString(),
        status:
          invitation.expiresAt.getTime() <= now
            ? "Expirado"
            : invitation.oneTimeUse && invitation.usedAt
              ? "Usado"
              : invitation.oneTimeUse
                ? "Disponivel"
                : "Reutilizavel",
      })),
    };
  }

  async allowEmail(emailInput: string, actorUserId: string) {
    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      throw badRequest("Informe um email valido.");
    }

    const allowedEmail = await this.allowedEmails.manager.transaction(
      async (manager) => {
        const existing = await manager.findOne(AllowedEmail, {
          where: { email },
        });
        const allowed =
          existing ??
          manager.create(AllowedEmail, {
            id: createId(),
            email,
            createdByUserId: actorUserId,
          });
        const saved = await manager.save(AllowedEmail, allowed);
        await manager.save(
          AuditLog,
          manager.create(AuditLog, {
            id: createId(),
            actorUserId,
            action: "email_allowed",
            metadata: { email },
          }),
        );
        return saved;
      },
    );

    return { allowedEmail };
  }

  async createInvitation(
    input: { expiresIn?: unknown; oneTimeUse?: boolean },
    actorUserId: string,
  ) {
    const expiresIn = input.expiresIn ?? "15m";
    if (!isInvitationExpiryPreset(expiresIn)) {
      throw badRequest("Informe uma validade valida para o convite.");
    }

    const token = createInvitationToken();
    const oneTimeUse =
      typeof input.oneTimeUse === "boolean" ? input.oneTimeUse : true;
    const invitation = await this.invitations.manager.transaction(
      async (manager) => {
        const created = await manager.save(
          AuthInvitation,
          manager.create(AuthInvitation, {
            id: createId(),
            tokenHash: hashInvitationToken(token),
            expiresAt: getInvitationExpiry(expiresIn),
            oneTimeUse,
            createdByUserId: actorUserId,
          }),
        );
        await manager.save(
          AuditLog,
          manager.create(AuditLog, {
            id: createId(),
            actorUserId,
            action: "invitation_created",
            metadata: {
              invitationId: created.id,
              expiresAt: created.expiresAt.toISOString(),
              oneTimeUse: created.oneTimeUse,
            },
          }),
        );
        return created;
      },
    );

    return {
      invitation: {
        id: invitation.id,
        expiresAt: invitation.expiresAt.toISOString(),
        oneTimeUse: invitation.oneTimeUse,
        usedAt: null,
        usedByEmail: null,
        createdAt: invitation.createdAt.toISOString(),
      },
      inviteUrl: `${this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000"}/invite/${token}`,
    };
  }

  async claim(token: string, emailInput: string) {
    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      throw badRequest("Informe um email valido.");
    }

    const tokenHash = hashInvitationToken(token);
    const now = new Date();

    const result = await this.invitations.manager.transaction(
      async (manager) => {
        const invitation = await manager.findOne(AuthInvitation, {
          where: { tokenHash },
        });
        if (!invitation || invitation.expiresAt <= now) {
          return null;
        }

        if (invitation.oneTimeUse && invitation.usedAt) {
          return null;
        }

        invitation.usedAt = now;
        invitation.usedByEmail = email;
        await manager.save(AuthInvitation, invitation);

        const existing = await manager.findOne(AllowedEmail, {
          where: { email },
        });
        if (!existing) {
          await manager.save(
            AllowedEmail,
            manager.create(AllowedEmail, {
              id: createId(),
              email,
              createdByUserId: invitation.createdByUserId,
            }),
          );
        }

        await manager.save(
          AuditLog,
          manager.create(AuditLog, {
            id: createId(),
            actorUserId: invitation.createdByUserId,
            action: "invitation_used",
            metadata: {
              invitationId: invitation.id,
              email,
              oneTimeUse: invitation.oneTimeUse,
            },
          }),
        );

        return true;
      },
    );

    if (!result) {
      throw badRequest("Convite invalido, expirado ou ja utilizado.");
    }

    return { ok: true, email };
  }
}
