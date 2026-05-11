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
  const allowedOrigins = config.getOrThrow<string[]>("CORS_ORIGIN");
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
    },
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

export function isAllowedCorsOrigin(origin: string | undefined, allowedOrigins: readonly string[]) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.some((allowedOrigin) => {
    if (origin === allowedOrigin) {
      return true;
    }

    return isSamePortSubdomain(origin, allowedOrigin);
  });
}

function isSamePortSubdomain(origin: string, allowedOrigin: string) {
  try {
    const requested = new URL(origin);
    const allowed = new URL(allowedOrigin);
    const rootHostname = getRootHostname(allowed.hostname);

    return (
      requested.protocol === allowed.protocol &&
      requested.port === allowed.port &&
      requested.hostname.endsWith(`.${rootHostname}`)
    );
  } catch {
    return false;
  }
}

function getRootHostname(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }

  const labels = hostname.split(".");
  return labels.length > 2 ? labels.slice(1).join(".") : hostname;
}
