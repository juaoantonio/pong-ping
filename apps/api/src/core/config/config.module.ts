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

export type ConfigSchema = AppConfig & CorsConfig & DatabaseConfig;

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

@Module({})
export class ConfigModule extends NestConfigModule {
  static forRoot(options: ConfigModuleOptions = {}) {
    const { envFilePath, ...otherOptions } = options;
    const envFilePaths = [
      ...(Array.isArray(envFilePath) ? envFilePath : envFilePath ? [envFilePath] : []),
      join(process.cwd(), "envs", `.env.${process.env.NODE_ENV ?? "development"}`),
      join(process.cwd(), "envs", ".env"),
    ];

    return NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
      validationSchema: Joi.object({
        ...appSchema,
        ...corsSchema,
        ...databaseSchema,
      }),
      ...otherOptions,
    });
  }
}
