import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Role } from "@pong-ping/shared";
import { Repository } from "typeorm";
import { AuditLog, User } from "../entities";
import {
  canChangeRole,
  canDeleteUser,
  createId,
  isRole,
} from "../domain/rules";
import { badRequest, forbidden, notFound } from "../shared/http-error";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async list(actor: { id: string; role: Role }) {
    const users = await this.users.find({
      where: actor.role === "superadmin" ? undefined : { role: "user" },
      order: { role: "ASC", createdAt: "DESC" },
    });

    return {
      users: users.map((user) => this.userDto(user)),
    };
  }

  async delete(actor: { id: string; role: Role }, id: string) {
    if (actor.id === id) {
      throw badRequest(
        "Voce nao pode remover sua propria conta.",
        "self_delete",
      );
    }

    await this.users.manager.transaction(async (manager) => {
      const target = await manager.findOne(User, { where: { id } });
      if (!target) {
        throw notFound("Usuario nao encontrado.", "target_not_found");
      }
      if (target.role === "superadmin") {
        const superAdminCount = await manager.count(User, {
          where: { role: "superadmin" },
        });
        if (superAdminCount <= 1) {
          throw badRequest(
            "O ultimo superadmin nao pode ser removido.",
            "last_superadmin_delete",
          );
        }
      }
      if (!canDeleteUser(actor.role, target.role)) {
        throw forbidden("Voce nao pode remover este usuario.");
      }

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          id: createId(),
          actorUserId: actor.id,
          targetUserId: target.id,
          action: "user_deleted",
          metadata: { targetEmail: target.email, previousRole: target.role },
        }),
      );
      await manager.delete(User, { id });
    });

    return { ok: true };
  }

  async updateRole(
    actor: { id: string; role: Role },
    id: string,
    role: unknown,
  ) {
    if (!canChangeRole(actor.role)) {
      throw forbidden("Sem permissao para alterar roles.");
    }
    if (!isRole(role)) {
      throw badRequest("Role invalida.", "invalid_role");
    }
    if (actor.id === id) {
      throw badRequest(
        "Voce nao pode alterar sua propria role.",
        "self_role_change",
      );
    }

    const user = await this.users.manager.transaction(async (manager) => {
      const target = await manager.findOne(User, { where: { id } });
      if (!target) {
        throw notFound("Usuario nao encontrado.", "target_not_found");
      }
      if (target.role === "superadmin" && role !== "superadmin") {
        const superAdminCount = await manager.count(User, {
          where: { role: "superadmin" },
        });
        if (superAdminCount <= 1) {
          throw badRequest(
            "O ultimo superadmin nao pode ser rebaixado.",
            "last_superadmin_role_change",
          );
        }
      }

      const previousRole = target.role;
      target.role = role;
      const saved = await manager.save(User, target);
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          id: createId(),
          actorUserId: actor.id,
          targetUserId: target.id,
          action: "role_changed",
          metadata: { previousRole, newRole: role, targetEmail: target.email },
        }),
      );
      return saved;
    });

    return { user: this.userDto(user) };
  }

  private userDto(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
