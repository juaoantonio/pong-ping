import type { Repository } from "typeorm";
import { describe, expect, it } from "vitest";
import { PaginationService } from "./pagination.service";

describe("servico de paginacao", () => {
  it("retorna metadados de pagina no estilo Spring", async () => {
    type Item = { value: string };
    const content = [{ value: "first" }, { value: "second" }];
    const repository = {
      findAndCount: async () => [content, 12],
    } as unknown as Repository<Item>;

    const result = await new PaginationService().paginate(repository, {
      page: 1,
      size: 2,
    });

    expect(result.content).toEqual(content);
    expect(result.page).toEqual({
      number: 1,
      size: 2,
      totalElements: 12,
      totalPages: 6,
    });
  });
});
