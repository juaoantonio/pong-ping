import { join } from "node:path";
import { Module } from "@nestjs/common";
import { type ConfigModuleOptions, ConfigModule as NestConfigModule } from "@nestjs/config";
import Joi, { type ArraySchema } from "joi";

type AppConfig = {
  NODE_ENV: string;
  VERSION: string;
  HOST: string;
  PORT: number;
  API_PREFIX: string;
};

type CorsConfig = {
  CORS_ORIGIN: string[];
};

type DatabaseConfig = {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_LOGGING: boolean;
  DB_SYNCHRONIZE: boolean;
};

type IdentityAuthConfig = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  SYSTEM_ADMIN_FRONTEND_URL: string;
  TENANT_FRONTEND_URL: string;
  SESSION_SECRET: string;
  SESSION_COOKIE_NAME: string;
  SESSION_TTL_SECONDS: number;
  ROOT_DOMAIN: string;
  RESERVED_TENANT_SUBDOMAINS: string[];
};

export type ConfigSchema = AppConfig & CorsConfig & DatabaseConfig & IdentityAuthConfig;

export const appSchema: Joi.StrictSchemaMap<AppConfig> = {
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  VERSION: Joi.string().required(),
  HOST: Joi.string().default("127.0.0.1"),
  PORT: Joi.number().integer().min(0).max(65535).default(3000),
  API_PREFIX: Joi.string()
    .pattern(/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/)
    .default("v1"),
};

export const corsSchema: Joi.StrictSchemaMap<CorsConfig> = {
  CORS_ORIGIN: Joi.string()
    .custom((value: string, helpers) => {
      try {
        const parsedValue = JSON.parse(value) as string[];
        if (!Array.isArray(parsedValue)) return helpers.error("any.invalid", { value });
        const { error } = Joi.array().items(Joi.string()).validate(parsedValue);
        if (error) return helpers.error("any.invalid", { value });
        return parsedValue;
      } catch {
        return helpers.error("any.invalid", { value });
      }
    })
    .messages({
      "any.invalid": "CORS_ORIGIN must be a JSON string containing an array of origins.",
    }) as unknown as ArraySchema<string[]>,
};

export const databaseSchema: Joi.StrictSchemaMap<DatabaseConfig> = {
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow("").required(),
  DB_DATABASE: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
};

const jsonStringArray = (label: string) =>
  Joi.string()
    .custom((value: string, helpers) => {
      try {
        const parsedValue = JSON.parse(value) as string[];
        if (!Array.isArray(parsedValue)) return helpers.error("any.invalid", { value });
        const { error } = Joi.array().items(Joi.string()).validate(parsedValue);
        if (error) return helpers.error("any.invalid", { value });
        return parsedValue;
      } catch {
        return helpers.error("any.invalid", { value });
      }
    })
    .messages({
      "any.invalid": `${label} must be a JSON string containing an array of strings.`,
    }) as unknown as ArraySchema<string[]>;

export const identityAuthSchema: Joi.StrictSchemaMap<IdentityAuthConfig> = {
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
  SYSTEM_ADMIN_FRONTEND_URL: Joi.string().uri().default("http://localhost:5173/admin/tenants"),
  TENANT_FRONTEND_URL: Joi.string().uri().default("http://localhost:5173/club"),
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_COOKIE_NAME: Joi.string().default("pong_ping_session"),
  SESSION_TTL_SECONDS: Joi.number().integer().min(60).default(60 * 60 * 24 * 14),
  ROOT_DOMAIN: Joi.string().hostname().default("localhost"),
  RESERVED_TENANT_SUBDOMAINS: jsonStringArray("RESERVED_TENANT_SUBDOMAINS").default([
    "api",
    "www",
  ]),
};

@Module({})
export class ConfigModule extends NestConfigModule {
  static forRoot(options: ConfigModuleOptions = {}) {
    const { envFilePath, ...otherOptions } = options;
    const envFilePaths = [
      ...(Array.isArray(envFilePath) ? envFilePath : envFilePath ? [envFilePath] : []),
      join(process.cwd(), "envs", ".env"),
      join(process.cwd(), "envs", `.env.${process.env.NODE_ENV ?? "development"}`),
    ];

    return NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
      validationSchema: Joi.object({
        ...appSchema,
        ...corsSchema,
        ...databaseSchema,
        ...identityAuthSchema,
      }),
      ...otherOptions,
    });
  }
}
