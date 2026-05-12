import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import { Club } from "../../../domain/club";
import { ClubId } from "../../../domain/value-objects/club-id";
import { ClubSlug } from "../../../domain/value-objects/club-slug";
import { ClubSchema } from "../schemas/club.schema";
import type { ClubPersistence } from "../schemas/club.schema";

@Injectable()
export class ClubRepository {
  public constructor(
    @InjectRepository(ClubSchema)
    private readonly clubs: Repository<ClubPersistence>,
  ) {}

  public async findById(id: ClubId): Promise<Club | null> {
    return (await this.clubs.findOneBy({ id } as FindOptionsWhere<ClubPersistence>)) as Club | null;
  }

  public async findBySlug(slug: ClubSlug): Promise<Club | null> {
    return (await this.clubs.findOneBy({
      slugValue: slug,
    } as FindOptionsWhere<ClubPersistence>)) as Club | null;
  }

  public async existsBySlug(slug: ClubSlug): Promise<boolean> {
    return (await this.findBySlug(slug)) !== null;
  }

  public async save(club: Club): Promise<Club> {
    return (await this.clubs.save(club as unknown as ClubPersistence)) as unknown as Club;
  }
}
