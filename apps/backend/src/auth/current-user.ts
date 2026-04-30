import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Role } from "@pong-ping/shared";

export type RequestUser = {
  id: string;
  role: Role;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
  return request.user;
});
