import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@pong-ping/shared";
import { hasRole } from "../domain/rules";
import { forbidden } from "../shared/http-error";
import type { RequestUser } from "./current-user";

export const REQUIRED_ROLE_KEY = "requiredRole";
export const RequireRole = (role: Role) => SetMetadata(REQUIRED_ROLE_KEY, role);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<Role>(REQUIRED_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user || !hasRole(request.user.role, requiredRole)) {
      throw forbidden();
    }

    return true;
  }
}
