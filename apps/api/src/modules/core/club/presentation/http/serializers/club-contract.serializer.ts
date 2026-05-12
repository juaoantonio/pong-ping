import type { ClubResponseContract } from "@pong-ping/contracts";
import { type Club } from "../../../domain";

export function toClubResponse(club: Club): ClubResponseContract {
  return {
    id: club.id.value,
    name: club.name.value,
    slug: club.slug.value,
    active: club.active,
    createdAt: club.createdAt.toISOString(),
  };
}
