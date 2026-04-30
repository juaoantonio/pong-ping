import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import Joi from "joi";
import { AccessController } from "./modules/access.controller";
import { AdminRoundsController } from "./modules/admin-rounds.controller";
import { AuthController } from "./modules/auth.controller";
import { RankingsController } from "./modules/rankings.controller";
import { RoomsController } from "./modules/rooms.controller";
import { UsersController } from "./modules/users.controller";
import { AccessService } from "./services/access.service";
import { AdminRoundsService } from "./services/admin-rounds.service";
import { AuthService } from "./services/auth.service";
import { RankingsService } from "./services/rankings.service";
import { RoomsService } from "./services/rooms.service";
import { UsersService } from "./services/users.service";
import { entities } from "./entities";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "../../.env"],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().allow("").default(""),
        AUTH_SECRET: Joi.string().allow("").default(""),
        GOOGLE_CLIENT_ID: Joi.string().allow("").default(""),
        GOOGLE_CLIENT_SECRET: Joi.string().allow("").default(""),
        AUTH_GOOGLE_ID: Joi.string().allow("").default(""),
        AUTH_GOOGLE_SECRET: Joi.string().allow("").default(""),
        GOOGLE_REDIRECT_URI: Joi.string().allow("").default(""),
        API_URL: Joi.string().allow("").default(""),
        FRONTEND_URL: Joi.string().default("http://localhost:3000"),
        SUPERADMIN_EMAIL: Joi.string().allow("").default(""),
        PORT: Joi.number().default(4000),
        HOST: Joi.string().default("0.0.0.0"),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.getOrThrow<string>("DATABASE_URL"),
        entities,
        synchronize: false,
        autoLoadEntities: false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>("JWT_SECRET") ||
          config.get<string>("AUTH_SECRET") ||
          "development-secret-change-me",
        signOptions: { expiresIn: "15m" },
      }),
    }),
  ],
  controllers: [
    AuthController,
    RankingsController,
    RoomsController,
    AccessController,
    UsersController,
    AdminRoundsController,
  ],
  providers: [AuthService, AccessService, RankingsService, RoomsService, UsersService, AdminRoundsService],
})
export class AppModule {}
