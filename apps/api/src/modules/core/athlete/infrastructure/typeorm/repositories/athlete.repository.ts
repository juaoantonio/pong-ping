import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import { ClubId } from "../../../../club/domain";
import { ActorId } from "../../../../shared/domain";
import { Athlete } from "../../../domain";
import { AthleteId } from "../../../domain";
import { AthleteSchema } from "../schemas/athlete.schema";
import type { AthletePersistence } from "../schemas/athlete.schema";

@Injectable()
export class AthleteRepository {
  public constructor(
    @InjectRepository(AthleteSchema)
    private readonly athletes: Repository<AthletePersistence>,
  ) {}

  public async findById(id: AthleteId): Promise<Athlete | null> {
    return (await this.athletes.findOneBy({
      id,
    } as FindOptionsWhere<AthletePersistence>)) as Athlete | null;
  }

  public async findByUserId(userId: ActorId): Promise<Athlete | null> {
    return (await this.athletes.findOneBy({
      userId,
    } as FindOptionsWhere<AthletePersistence>)) as Athlete | null;
  }

  public async findByClubAndUserId(
    clubId: ClubId,
    userId: ActorId,
  ): Promise<Athlete | null> {
    return (await this.athletes.findOneBy({
      clubId,
      userId,
    } as FindOptionsWhere<AthletePersistence>)) as Athlete | null;
  }

  public async save(athlete: Athlete): Promise<Athlete> {
    return (await this.athletes.save(
      athlete as unknown as AthletePersistence,
    )) as unknown as Athlete;
  }
}
