import { type TableId } from "../../table/domain";
import { Invitation, type InvitationState } from "./invitation";

type TableInviteInput = {
  tableId: TableId;
} & InvitationState;

export class TableInvite extends Invitation {
  private readonly tableIdValue: TableId;

  private constructor(input: TableInviteInput) {
    super(input);
    this.tableIdValue = input.tableId;
  }

  public static create(input: TableInviteInput): TableInvite {
    return new TableInvite(input);
  }

  public get tableId(): TableId {
    return this.tableIdValue;
  }
}
