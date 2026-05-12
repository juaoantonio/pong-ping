import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../../common/context";
import { CoreIdentityTranslator } from "../application/identity";
import { AthleteModule } from "../athlete/athlete.module";
import {
  CreateTableUseCase,
  EnqueueTableUseCase,
  FormActiveGameUseCase,
  RemoveFromActiveGameUseCase,
  RemoveFromQueueUseCase,
  RenameTableUseCase,
  RotateWinnerStaysUseCase,
} from "./application/use-cases";
import { TableCommandController } from "./table-command.controller";
import { TableRepository } from "./infrastructure/typeorm/repositories/table.repository";
import { QueueEntrySchema } from "./infrastructure/typeorm/schemas/queue-entry.schema";
import { TableMemberSchema } from "./infrastructure/typeorm/schemas/table-member.schema";
import { TableSchema } from "./infrastructure/typeorm/schemas/table.schema";

const tableUseCaseProviders = [
  CreateTableUseCase,
  RenameTableUseCase,
  EnqueueTableUseCase,
  RemoveFromQueueUseCase,
  RemoveFromActiveGameUseCase,
  FormActiveGameUseCase,
  RotateWinnerStaysUseCase,
].map((useCase) => ({
  provide: useCase,
  inject: [TableRepository],
  useFactory: (tables: TableRepository) => new useCase(tables),
}));

@Module({
  imports: [
    RequestContextModule,
    TypeOrmModule.forFeature([TableSchema, TableMemberSchema, QueueEntrySchema]),
    AthleteModule,
  ],
  controllers: [TableCommandController],
  providers: [TableRepository, CoreIdentityTranslator, ...tableUseCaseProviders],
  exports: [
    TableRepository,
    CreateTableUseCase,
    RenameTableUseCase,
    EnqueueTableUseCase,
    RemoveFromQueueUseCase,
    RemoveFromActiveGameUseCase,
    FormActiveGameUseCase,
    RotateWinnerStaysUseCase,
  ],
})
export class TableModule {}
