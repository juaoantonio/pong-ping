import { Module } from "@nestjs/common";
import { ClsModule } from "nestjs-cls";
import { CurrentContextService } from "./current-context.service";

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
  ],
  providers: [CurrentContextService],
  exports: [CurrentContextService],
})
export class RequestContextModule {}
