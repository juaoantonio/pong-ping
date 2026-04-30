import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, type RequestUser } from "../auth/current-user";
import { RequireRole, RolesGuard } from "../auth/roles.guard";
import { UpdateRoleDto } from "../dtos";
import { UsersService } from "../services/users.service";

@Controller("admin/users")
@UseGuards(AuthGuard, RolesGuard)
@RequireRole("admin")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.users.list(user);
  }

  @Delete(":id")
  delete(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.users.delete(user, id);
  }

  @Patch(":id/role")
  updateRole(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() body: UpdateRoleDto,
  ) {
    return this.users.updateRole(user, id, body.role);
  }
}
