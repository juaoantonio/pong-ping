export type ActorWithTenant = {
  tenantId?: string | null;
};

export function getActorTenantId(actor: ActorWithTenant) {
  return actor.tenantId ?? null;
}
