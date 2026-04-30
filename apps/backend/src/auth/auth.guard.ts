import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { unauthorized } from "../shared/http-error";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = this.getToken(request);

    if (!token) {
      throw unauthorized();
    }

    try {
      const payload = this.jwt.verify(token) as { sub: string; role: string };
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw unauthorized();
    }
  }

  private getToken(request: Request) {
    const authorization = request.header("authorization");
    if (authorization?.startsWith("Bearer ")) {
      return authorization.slice("Bearer ".length);
    }

    return request.cookies?.pp_access_token as string | undefined;
  }
}
