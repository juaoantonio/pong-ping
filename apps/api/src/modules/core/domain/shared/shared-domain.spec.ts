import { describe, expect, it } from "vitest";
import { AggregateRoot } from "./aggregate-root";
import type { DomainEvent } from "./domain-event";
import { Entity } from "./entity";
import { DomainRuleViolation } from "./errors/domain-rule-violation";
import { DomainId } from "./value-objects/domain-id";

class TestId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_test_id");
  }
}

class TestEntity extends Entity<TestId> {
  public constructor(id: TestId) {
    super(id);
  }
}

class TestAggregate extends AggregateRoot<TestId> {
  public constructor(id: TestId) {
    super(id);
  }

  public record(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}

describe("shared domain kernel", () => {
  it("compares entities by identity object", () => {
    const id = new TestId("test-1");

    expect(new TestEntity(id).equals(new TestEntity(id))).toBe(true);
    expect(new TestEntity(id).equals(new TestEntity(new TestId("test-2")))).toBe(false);
  });

  it("stores and pulls domain events once", () => {
    const aggregate = new TestAggregate(new TestId("test-1"));
    aggregate.record({ eventVersion: 1, occurredAt: new Date("2026-01-01") });

    expect(aggregate.pullDomainEvents()).toHaveLength(1);
    expect(aggregate.pullDomainEvents()).toEqual([]);
  });

  it("rejects blank IDs with stable domain code", () => {
    expect(() => new TestId(" ")).toThrow(DomainRuleViolation);

    try {
      new TestId(" ");
    } catch (error) {
      expect(error).toMatchObject({ code: "invalid_test_id" });
    }
  });
});
