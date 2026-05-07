import { AggregateRoot } from "../../core/domain/shared";
import { type Email } from "./value-objects/email";
import { type UserId } from "./value-objects/user-id";
import { ensureUserRole, type UserRole } from "./user-role";

type UserState = {
  id: UserId;
  email: Email;
  role: UserRole | string;
  active?: boolean;
};

export class User extends AggregateRoot<UserId> {
  private emailValue: Email;
  private roleValue: UserRole;
  private activeValue: boolean;

  private constructor(state: UserState) {
    super(state.id);
    this.emailValue = state.email;
    this.roleValue = ensureUserRole(state.role);
    this.activeValue = state.active ?? true;
  }

  public static create(state: UserState): User {
    return new User(state);
  }

  public get email(): Email {
    return this.emailValue;
  }

  public get role(): UserRole {
    return this.roleValue;
  }

  public get active(): boolean {
    return this.activeValue;
  }

  public changeEmail(email: Email): void {
    this.emailValue = email;
  }

  public deactivate(): void {
    this.activeValue = false;
  }

  public activate(): void {
    this.activeValue = true;
  }
}
