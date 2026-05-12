import { describe, expect, it } from "vitest";
import { HttpStatus } from "@nestjs/common";
import { DomainRuleViolation } from "../../../modules/core/shared/domain";
import { GlobalExceptionFilter } from "./global-exception.filter";

type NormalizedError = {
  status: number;
  code: string;
  message: string;
  details: unknown[];
};

describe("GlobalExceptionFilter", () => {
  const normalize = (exception: unknown): NormalizedError =>
    (
      new GlobalExceptionFilter() as unknown as {
        normalize(exception: unknown): NormalizedError;
      }
    ).normalize(exception);

  it("mapeia erro de dominio inexistente para not found", () => {
    const normalized = normalize(new DomainRuleViolation("club_not_found", "Club was not found."));

    expect(normalized).toMatchObject({
      status: HttpStatus.NOT_FOUND,
      code: "club_not_found",
      details: [],
    });
  });

  it("mapeia erro de dominio duplicado para conflito", () => {
    const normalized = normalize(
      new DomainRuleViolation("club_slug_already_exists", "Club slug already exists."),
    );

    expect(normalized.status).toBe(HttpStatus.CONFLICT);
  });

  it("mapeia erro de dominio comum para bad request", () => {
    const normalized = normalize(
      new DomainRuleViolation("invalid_table_name", "Table name is invalid."),
    );

    expect(normalized.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
