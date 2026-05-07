import type { LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";
import type { ConfigSchema } from "./common/config/config.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<ConfigSchema>);
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);
  configureApp(app);

  const port = config.getOrThrow<number>("PORT");
  const host = config.getOrThrow<string>("HOST");
  const prefix = config.getOrThrow<string>("API_PREFIX");

  await app.listen(port, host);
  logger.log(`API listening at http://${host}:${port}/${prefix}`);
  logger.log(`OpenAPI JSON at http://${host}:${port}/${prefix}/swagger.json`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
