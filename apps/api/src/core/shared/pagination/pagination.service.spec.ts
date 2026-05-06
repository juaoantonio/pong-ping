import type { Repository } from "typeorm";
import { describe, expect, it } from "vitest";
import { PaginationService } from "./pagination.service";

describe("PaginationService", () => {
  it("returns Spring-style page metadata", async () => {
    const repository = {
      findAndCount: async () => [["first", "second"], 12],
    } as unknown as Repository<string>;

    const result = await new PaginationService().paginate(repository, {
      page: 1,
      size: 2,
    });

    expect(result.content).toEqual(["first", "second"]);
    expect(result.page).toEqual({
      number: 1,
      size: 2,
      totalElements: 12,
      totalPages: 6,
    });
  });
});
