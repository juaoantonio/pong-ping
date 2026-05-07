export abstract class Entity<TId> {
  public readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  public equals(other: Entity<TId> | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (Object.is(this.id, other.id)) {
      return true;
    }

    if (hasIdentityEquals(this.id)) {
      return this.id.equals(other.id);
    }

    return this.id === other.id;
  }
}

function hasIdentityEquals<TId>(value: TId): value is TId & { equals(other: TId): boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "equals" in value &&
    typeof value.equals === "function"
  );
}
