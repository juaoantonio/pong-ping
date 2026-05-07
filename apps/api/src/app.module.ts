import { Module } from "@nestjs/common";
import { ConfigModule } from "./common/config/config.module";
import { RequestContextModule } from "./common/context";
import { DatabaseModule } from "./common/database/database.module";
import { HealthModule } from "./common/health/health.module";
import { LoggingModule } from "./common/logging/logging.module";
import { SharedModule } from "./common/shared/shared.module";
import { IdentityModule } from "./modules/identity/identity.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggingModule,
    SharedModule,
    RequestContextModule,
    DatabaseModule,
    IdentityModule,
    HealthModule,
  ],
})
export class AppModule {}
