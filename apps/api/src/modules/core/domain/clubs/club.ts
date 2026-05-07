import { AggregateRoot, DomainRuleViolation } from "../shared";
import { type ClubId } from "./value-objects/club-id";
import { type ClubName } from "./value-objects/club-name";
import { type ClubSlug } from "./value-objects/club-slug";

type ClubInput = {
  id: ClubId;
  name: ClubName;
  slug: ClubSlug;
  createdAt: Date;
  active?: boolean;
};

export class Club extends AggregateRoot<ClubId> {
  private nameValue: ClubName;
  private slugValue: ClubSlug;
  private activeValue: boolean;
  public readonly createdAt: Date;

  private constructor(input: ClubInput) {
    super(input.id);
    this.nameValue = input.name;
    this.slugValue = input.slug;
    this.createdAt = input.createdAt;
    this.activeValue = input.active ?? true;
  }

  public static create(input: Omit<ClubInput, "active">): Club {
    return new Club(input);
  }

  public get name(): ClubName {
    return this.nameValue;
  }

  public get slug(): ClubSlug {
    return this.slugValue;
  }

  public get active(): boolean {
    return this.activeValue;
  }

  public rename(name: ClubName): void {
    this.nameValue = name;
  }

  public changeSlug(slug: ClubSlug): void {
    this.slugValue = slug;
  }

  public activate(): void {
    this.activeValue = true;
  }

  public deactivate(): void {
    this.activeValue = false;
  }

  public ensureSameClub(other: ClubId): void {
    if (!this.id.equals(other)) {
      throw new DomainRuleViolation(
        "cross_club_operation",
        "Operation cannot combine domain data from different clubs.",
      );
    }
  }
}
