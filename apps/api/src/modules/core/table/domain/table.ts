import { type AthleteId } from "../../athlete/domain";
import { type ClubId } from "../../club/domain";
import { AggregateRoot, DomainRuleViolation } from "../../shared/domain";
import { type ActiveGame } from "./active-game";
import { type GameSide } from "./game-side";
import { type QueueEntry } from "./queue-entry";
import { TableMember } from "./table-member";
import { TableQueue } from "./table-queue";
import { type PlayMode, type TableId, type TableName } from "./value-objects";

type TableInput = {
  id: TableId;
  clubId: ClubId;
  name: TableName;
  playMode: PlayMode;
  createdByAthleteId: AthleteId;
  createdAt: Date;
};

type EnqueueResult = {
  membershipCreated: boolean;
  queueEntry: QueueEntry;
};

export class Table extends AggregateRoot<TableId> {
  public readonly clubId: ClubId;
  public readonly createdByAthleteId: AthleteId;
  public readonly createdAt: Date;
  private nameValue: TableName;
  private playModeValue: PlayMode;
  private membersValue: TableMember[];
  private queueValue: TableQueue;

  private constructor(input: TableInput) {
    super(input.id);
    this.clubId = input.clubId;
    this.nameValue = input.name;
    this.playModeValue = input.playMode;
    this.createdByAthleteId = input.createdByAthleteId;
    this.createdAt = input.createdAt;
    this.membersValue = [
      TableMember.create({
        athleteId: input.createdByAthleteId,
        joinedAt: input.createdAt,
      }),
    ];
    this.queueValue = TableQueue.create();
  }

  public static create(input: TableInput): Table {
    return new Table(input);
  }

  public get name(): TableName {
    return this.nameValue;
  }

  public get playMode(): PlayMode {
    return this.playModeValue;
  }

  public get members(): readonly TableMember[] {
    return [...this.membersValue];
  }

  public get queue(): TableQueue {
    return TableQueue.create([...this.queueValue.entries]);
  }

  public addMember(athleteId: AthleteId, joinedAt = new Date()): boolean {
    if (this.hasMember(athleteId)) {
      return false;
    }

    this.membersValue = [...this.membersValue, TableMember.create({ athleteId, joinedAt })];

    return true;
  }

  public enqueue(athleteId: AthleteId, joinedAt = new Date()): EnqueueResult {
    if (this.queueValue.hasAthlete(athleteId)) {
      throw new DomainRuleViolation(
        "athlete_already_queued",
        "Athlete is already queued on this table.",
      );
    }

    const membershipCreated = this.addMember(athleteId, joinedAt);
    const queueEntry = this.queueValue.enqueue(athleteId, joinedAt);

    return { membershipCreated, queueEntry };
  }

  public removeFromQueue(athleteId: AthleteId): QueueEntry {
    if (
      this.queueValue.hasPlayableActiveGame(this.playModeValue) &&
      this.queueValue.isCurrentAthlete(athleteId, this.playModeValue)
    ) {
      throw new DomainRuleViolation(
        "current_player_cannot_leave_queue",
        "Current active players cannot leave the normal queue.",
      );
    }

    return this.queueValue.remove(athleteId);
  }

  public removeFromActiveGame(athleteId: AthleteId): QueueEntry {
    if (!this.queueValue.isCurrentAthlete(athleteId, this.playModeValue)) {
      throw new DomainRuleViolation(
        "athlete_not_in_active_game",
        "Athlete is not part of the current active game.",
      );
    }

    return this.queueValue.remove(athleteId);
  }

  public formActiveGame(): ActiveGame {
    return this.queueValue.formActiveGame(this.playModeValue);
  }

  public rotateWinnerStays(winningSide: GameSide): ActiveGame {
    return this.queueValue.rotateWinnerStays(this.playModeValue, winningSide);
  }

  public rename(name: TableName): void {
    this.nameValue = name;
  }

  private hasMember(athleteId: AthleteId): boolean {
    return this.membersValue.some((member) => member.belongsTo(athleteId));
  }
}
