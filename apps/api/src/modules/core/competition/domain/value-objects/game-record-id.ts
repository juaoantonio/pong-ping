import { DomainId } from "../../../shared/domain";

export class GameRecordId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_game_record_id");
  }
}
