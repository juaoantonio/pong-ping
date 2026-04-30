import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./shared/global-exception.filter";
import { SuccessEnvelopeInterceptor } from "./shared/success-envelope.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const frontendUrl =
    config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SuccessEnvelopeInterceptor());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Pong Ping API")
      .setDescription(
        "NestJS API for Pong Ping rankings, rooms, invitations, and admin workflows.",
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("api/v1/swagger", app, document);
  app.use(
    "/api/v1/docs",
    apiReference({
      spec: { content: document },
    }),
  );

  await app.listen(
    config.get<number>("PORT") ?? 4000,
    config.get<string>("HOST") ?? "0.0.0.0",
  );
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
