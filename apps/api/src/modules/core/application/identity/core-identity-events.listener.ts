import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  IDENTITY_EVENT,
  type IdentityTenantCreatedEvent,
  type IdentityTenantUpdatedEvent,
  type IdentityTenantUserAuthenticatedEvent,
} from "../../../../common/events/identity.events";
import {
  ActivateClubUseCase,
  ChangeClubSlugUseCase,
  CreateClubUseCase,
  DeactivateClubUseCase,
  RenameClubUseCase,
} from "../../club/application/use-cases";
import { ClubId } from "../../club/domain";
import { ClubRepository } from "../../club/infrastructure/typeorm/repositories/club.repository";
import { ActorId } from "../../shared/domain";
import { RegisterAthleteUseCase } from "../../athlete/application/use-cases";
import { AthleteRepository } from "../../athlete/infrastructure/typeorm/repositories/athlete.repository";

@Injectable()
export class CoreIdentityEventsListener {
  public constructor(
    private readonly clubs: ClubRepository,
    private readonly athletes: AthleteRepository,
    private readonly createClub: CreateClubUseCase,
    private readonly renameClub: RenameClubUseCase,
    private readonly changeClubSlug: ChangeClubSlugUseCase,
    private readonly activateClub: ActivateClubUseCase,
    private readonly deactivateClub: DeactivateClubUseCase,
    private readonly registerAthlete: RegisterAthleteUseCase,
  ) {}

  @OnEvent(IDENTITY_EVENT.TENANT_CREATED, { suppressErrors: false })
  public async handleTenantCreated(event: IdentityTenantCreatedEvent): Promise<void> {
    if (await this.clubs.findById(ClubId.from(event.tenantId))) {
      return;
    }

    await this.createClub.execute({
      id: event.tenantId,
      name: event.name,
      slug: event.slug,
      createdAt: event.occurredAt,
    });

    if (!event.active) {
      await this.deactivateClub.execute({ clubId: event.tenantId });
    }
  }

  @OnEvent(IDENTITY_EVENT.TENANT_UPDATED, { suppressErrors: false })
  public async handleTenantUpdated(event: IdentityTenantUpdatedEvent): Promise<void> {
    const club = await this.clubs.findById(ClubId.from(event.tenantId));
    if (!club) {
      await this.handleTenantCreated(event);
      return;
    }

    await this.renameClub.execute({ clubId: event.tenantId, name: event.name });
    await this.changeClubSlug.execute({ clubId: event.tenantId, slug: event.slug });

    if (event.active) {
      await this.activateClub.execute({ clubId: event.tenantId });
    } else {
      await this.deactivateClub.execute({ clubId: event.tenantId });
    }
  }

  @OnEvent(IDENTITY_EVENT.TENANT_USER_AUTHENTICATED, { suppressErrors: false })
  public async handleTenantUserAuthenticated(
    event: IdentityTenantUserAuthenticatedEvent,
  ): Promise<void> {
    if (await this.athletes.findByUserId(ActorId.from(event.userId))) {
      return;
    }

    await this.registerAthlete.execute({
      id: randomUUID(),
      clubId: event.tenantId,
      userId: event.userId,
      displayName: event.displayName ?? displayNameFromEmail(event.email),
    });
  }
}

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length >= 2 ? localPart : "Athlete";
}
