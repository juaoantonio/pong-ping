import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Redirect,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, type RequestUser } from "../auth/current-user";
import { UpdateProfileDto } from "../dtos";
import { AuthService } from "../services/auth.service";
import { badRequest } from "../shared/http-error";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("google")
  @Redirect()
  startGoogle() {
    return { url: this.auth.googleAuthUrl(), statusCode: 302 };
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!code) {
      throw badRequest("Codigo de login ausente.", "missing_oauth_code");
    }

    await this.auth.handleGoogleCallback(code, response);
    return response.redirect(
      `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/rooms`,
    );
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.auth.logout(response);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: RequestUser) {
    return { user: await this.auth.getUser(user.id) };
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateProfileDto,
  ) {
    return { user: await this.auth.updateProfile(user.id, body.name) };
  }
}
