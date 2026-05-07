export class DomainRuleViolation extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = "DomainRuleViolation";
    this.code = code;
  }
}
