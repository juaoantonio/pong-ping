export interface DomainEvent {
  readonly eventVersion: number;
  readonly occurredAt: Date;
}
