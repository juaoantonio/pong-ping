import { Module } from "@nestjs/common";
import { ConfigModule } from "./core/config/config.module";
import { DatabaseModule } from "./core/database/database.module";
import { HealthModule } from "./core/health/health.module";
import { LoggingModule } from "./core/logging/logging.module";
import { SharedModule } from "./core/shared/shared.module";

@Module({
  imports: [ConfigModule.forRoot(), LoggingModule, SharedModule, DatabaseModule, HealthModule],
})
export class AppModule {}
