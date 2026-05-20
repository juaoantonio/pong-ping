import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import type {
  CorePageMetaContract,
  CorePageRequestContract,
  CorePageResponseContract,
} from "@pong-ping/contracts";

export class CorePageQueryDto implements CorePageRequestContract {
  @ApiProperty({ default: 1, required: false, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ default: 20, required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class CorePageMetaDto implements CorePageMetaContract {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 42 })
  totalItems!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class CorePageResponseDto<TItem> implements CorePageResponseContract<TItem> {
  @ApiProperty({ isArray: true })
  items!: TItem[];

  @ApiProperty({ type: CorePageMetaDto })
  page!: CorePageMetaDto;
}

export function createCorePage<TItem>(
  items: TItem[],
  totalItems: number,
  request: CorePageRequestContract,
): CorePageResponseContract<TItem> {
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 20;

  return {
    items,
    page: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export function corePageSkip(request: CorePageRequestContract): number {
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 20;

  return (page - 1) * pageSize;
}
