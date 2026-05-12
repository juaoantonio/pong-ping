import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  EnqueueTableUseCase,
  FormActiveGameUseCase,
  RemoveFromQueueUseCase,
  RotateWinnerStaysUseCase,
} from "./application/use-cases";
import { TableRepository } from "./infrastructure/typeorm/repositories/table.repository";
import { QueueEntrySchema } from "./infrastructure/typeorm/schemas/queue-entry.schema";
import { TableMemberSchema } from "./infrastructure/typeorm/schemas/table-member.schema";
import { TableSchema } from "./infrastructure/typeorm/schemas/table.schema";

const tableUseCaseProviders = [
  EnqueueTableUseCase,
  RemoveFromQueueUseCase,
  FormActiveGameUseCase,
  RotateWinnerStaysUseCase,
].map((useCase) => ({
  provide: useCase,
  inject: [TableRepository],
  useFactory: (tables: TableRepository) => new useCase(tables),
}));

@Module({
  imports: [TypeOrmModule.forFeature([TableSchema, TableMemberSchema, QueueEntrySchema])],
  providers: [TableRepository, ...tableUseCaseProviders],
  exports: [
    TableRepository,
    EnqueueTableUseCase,
    RemoveFromQueueUseCase,
    FormActiveGameUseCase,
    RotateWinnerStaysUseCase,
  ],
})
export class TableModule {}
