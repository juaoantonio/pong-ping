import { DomainId } from "../../shared";

export class TableId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_table_id");
  }
}
