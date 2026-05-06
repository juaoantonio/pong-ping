import { Injectable } from "@nestjs/common";
import type { FindManyOptions, ObjectLiteral, Repository } from "typeorm";
import type { PageDto } from "./page.dto";
import type { PaginationRequestDto } from "./pagination-request.dto";

@Injectable()
export class PaginationService {
  async paginate<T extends ObjectLiteral>(
    repository: Repository<T>,
    request: PaginationRequestDto,
    options: FindManyOptions<T> = {},
  ): Promise<PageDto<T>> {
    const [content, totalElements] = await repository.findAndCount({
      ...options,
      skip: request.page * request.size,
      take: request.size,
    });

    return {
      content,
      page: {
        number: request.page,
        size: request.size,
        totalElements,
        totalPages: Math.ceil(totalElements / request.size),
      },
    };
  }
}
