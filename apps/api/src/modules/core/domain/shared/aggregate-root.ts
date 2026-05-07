import { Entity } from "./entity";
import type { DomainEvent } from "./domain-event";

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    return this.domainEvents.splice(0);
  }
}
