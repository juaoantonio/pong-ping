import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import type { Response } from "express";
import { Repository } from "typeorm";
import { AllowedEmail, OAuthAccount, Session, User } from "../entities";
import {
  createId,
  isInitialSuperAdminEmail,
  normalizeEmail,
} from "../domain/rules";
import { badRequest, forbidden, unauthorized } from "../shared/http-error";

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(OAuthAccount)
    private readonly accounts: Repository<OAuthAccount>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(AllowedEmail)
    private readonly allowedEmails: Repository<AllowedEmail>,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  googleAuthUrl() {
    const clientId = this.googleClientId();
    if (!clientId) {
      throw badRequest(
        "Google OAuth nao esta configurado.",
        "google_oauth_not_configured",
      );
    }

    const redirectUri = this.googleRedirectUri();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, response: Response) {
    const token = await this.exchangeCode(code);
    const profile = await this.fetchGoogleProfile(token.access_token);
    const user = await this.signInGoogleUser(profile, token);
    await this.issueSession(user, response);
    return user;
  }

  async getUser(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw unauthorized();
    }
    return this.toAuthUser(user);
  }

  async updateProfile(userId: string, name: string) {
    const user = await this.users.findOneByOrFail({ id: userId });
    user.name = name.trim();
    return this.toAuthUser(await this.users.save(user));
  }

  async logout(response: Response, sessionToken?: string) {
    if (sessionToken) {
      await this.sessions.delete({ sessionToken });
    }
    this.clearCookies(response);
    return { ok: true };
  }

  private async signInGoogleUser(
    profile: GoogleProfile,
    token: GoogleTokenResponse,
  ) {
    const email = normalizeEmail(profile.email ?? "");
    if (!email || profile.email_verified !== true) {
      throw forbidden("Email Google nao verificado.");
    }

    const superadminEmail = this.config.get<string>("SUPERADMIN_EMAIL");
    const initialSuperadmin = isInitialSuperAdminEmail(email, superadminEmail);
    const allowed =
      initialSuperadmin ||
      (await this.allowedEmails.exist({ where: { email } }));
    if (!allowed) {
      throw forbidden("Email nao autorizado.");
    }

    let user =
      (await this.users.findOne({ where: { googleId: profile.sub } })) ??
      (await this.users.findOne({ where: { email } }));

    if (!user) {
      user = this.users.create({
        id: createId(),
        email,
        name: profile.name ?? null,
        image: profile.picture ?? null,
        avatarUrl: profile.picture ?? null,
        googleId: profile.sub,
        role: initialSuperadmin ? "superadmin" : "user",
      });
    } else {
      user.email = email;
      user.name = user.name ?? profile.name ?? null;
      user.image = profile.picture ?? user.image;
      user.avatarUrl = profile.picture ?? user.avatarUrl ?? user.image;
      user.googleId = profile.sub;
      if (initialSuperadmin) {
        user.role = "superadmin";
      }
    }

    const savedUser = await this.users.manager.transaction(async (manager) => {
      const nextUser = await manager.save(User, user);

      if (initialSuperadmin) {
        await manager.upsert(
          AllowedEmail,
          { id: createId(), email, createdByUserId: nextUser.id },
          ["email"],
        );
      }

      await manager.upsert(
        OAuthAccount,
        {
          id: createId(),
          userId: nextUser.id,
          type: "oauth",
          provider: "google",
          providerAccountId: profile.sub,
          access_token: token.access_token,
          expires_at: token.expires_in
            ? Math.floor(Date.now() / 1000) + token.expires_in
            : null,
          token_type: token.token_type ?? null,
          scope: token.scope ?? null,
          id_token: token.id_token ?? null,
          refresh_token: null,
          session_state: null,
        },
        ["provider", "providerAccountId"],
      );

      return nextUser;
    });

    return savedUser;
  }

  private async issueSession(user: User, response: Response) {
    const sessionToken = createId() + createId();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.sessions.save(
      this.sessions.create({
        id: createId(),
        sessionToken,
        userId: user.id,
        expires,
      }),
    );

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: this.config.get<string>("NODE_ENV") === "production",
      path: "/",
    };

    response.cookie("pp_access_token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    response.cookie("pp_session_token", sessionToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearCookies(response: Response) {
    response.clearCookie("pp_access_token", { path: "/" });
    response.clearCookie("pp_session_token", { path: "/" });
  }

  private googleRedirectUri() {
    return (
      this.config.get<string>("GOOGLE_REDIRECT_URI") ||
      `${this.config.get<string>("API_URL") ?? "http://localhost:4000"}/api/v1/auth/google/callback`
    );
  }

  private async exchangeCode(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.googleClientId(),
        client_secret: this.googleClientSecret(),
        redirect_uri: this.googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw badRequest(
        "Nao foi possivel concluir login com Google.",
        "google_token_exchange_failed",
      );
    }

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private async fetchGoogleProfile(
    accessToken: string,
  ): Promise<GoogleProfile> {
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw badRequest(
        "Nao foi possivel carregar perfil Google.",
        "google_profile_failed",
      );
    }

    return response.json() as Promise<GoogleProfile>;
  }

  private googleClientId() {
    return (
      this.config.get<string>("GOOGLE_CLIENT_ID") ||
      this.config.get<string>("AUTH_GOOGLE_ID") ||
      ""
    );
  }

  private googleClientSecret() {
    return (
      this.config.get<string>("GOOGLE_CLIENT_SECRET") ||
      this.config.get<string>("AUTH_GOOGLE_SECRET") ||
      ""
    );
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
      role: user.role,
    };
  }
}
