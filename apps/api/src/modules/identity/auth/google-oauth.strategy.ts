import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import type { ConfigSchema } from "../../../common/config/config.module";
import type { GoogleProfile } from "./google-profile";

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, "google") {
  public constructor(config: ConfigService<ConfigSchema>) {
    super({
      clientID: config.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: config.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: config.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    });
  }

  public validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google profile did not include an email."));
      return;
    }

    const avatarUrl = profile.photos?.[0]?.value ?? null;
    const googleProfile: GoogleProfile = {
      googleSubject: profile.id,
      email,
      displayName: profile.displayName ?? null,
      avatarUrl,
    };

    done(null, googleProfile);
  }
}
