import { Module } from "@nestjs/common";
import { ConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./common/database/database.module";
import { HealthModule } from "./common/health/health.module";
import { LoggingModule } from "./common/logging/logging.module";
import { SharedModule } from "./common/shared/shared.module";

@Module({
  imports: [ConfigModule.forRoot(), LoggingModule, SharedModule, DatabaseModule, HealthModule],
})
export class AppModule {}
