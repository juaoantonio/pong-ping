import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { ConfigSchema } from "./common/config/config.module";
import { GlobalExceptionFilter } from "./common/shared/filters/global-exception.filter";
import { SuccessEnvelopeInterceptor } from "./common/shared/interceptors/success-envelope.interceptor";
import { requestIdMiddleware } from "./common/shared/middleware/request-id.middleware";
import { createValidationPipe } from "./common/shared/validation/validation.pipe";

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService<ConfigSchema>);
  const prefix = config.getOrThrow<string>("API_PREFIX");

  app.setGlobalPrefix(prefix);
  app.use(requestIdMiddleware);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new SuccessEnvelopeInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: config.getOrThrow<string[]>("CORS_ORIGIN"),
    credentials: true,
  });

  const documentConfig = new DocumentBuilder()
    .setTitle("Api API")
    .setDescription("Pong Ping backend API service.")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup(`${prefix}/swagger`, app, document, {
    jsonDocumentUrl: `/${prefix}/swagger.json`,
    yamlDocumentUrl: `/${prefix}/swagger.yaml`,
  });
  app.use(
    `/${prefix}/docs`,
    apiReference({
      url: `/${prefix}/swagger.json`,
    }),
  );
}
