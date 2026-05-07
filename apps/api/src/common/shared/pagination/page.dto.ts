import { ApiProperty } from "@nestjs/swagger";

export class PageMetadataDto {
  @ApiProperty({ example: 0 })
  number!: number;

  @ApiProperty({ example: 20 })
  size!: number;

  @ApiProperty({ example: 100 })
  totalElements!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

export class PageDto<T> {
  @ApiProperty({ isArray: true })
  content!: T[];

  @ApiProperty({ type: PageMetadataDto })
  page!: PageMetadataDto;
}
