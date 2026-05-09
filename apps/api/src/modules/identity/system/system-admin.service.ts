import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import type { ConfigSchema } from "../../../common/config/config.module";
import { IdentityUserEntity, TenantEntity, TenantMembershipEntity } from "../entities";
import { IDENTITY_TENANT_ROLE } from "../identity-roles";
import type {
  CreateSystemMembershipRequestDto,
  CreateSystemTenantRequestDto,
  SystemMembershipResponseDto,
  SystemTenantResponseDto,
  UpdateSystemMembershipRequestDto,
  UpdateSystemTenantRequestDto,
} from "./dtos/system-admin.dtos";
import {
  assertTenantRoles,
  assertTenantSlugAllowed,
  hasTenantAdminRole,
  normalizeEmail,
} from "./system-admin.validation";

@Injectable()
export class SystemAdminService {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(IdentityUserEntity)
    private readonly users: Repository<IdentityUserEntity>,
    @InjectRepository(TenantMembershipEntity)
    private readonly memberships: Repository<TenantMembershipEntity>,
  ) {}

  public async listTenants(): Promise<SystemTenantResponseDto[]> {
    const tenants = await this.tenants.find({
      relations: { memberships: { user: true } },
      order: { createdAt: "DESC" },
    });

    return tenants.map((tenant) => this.toTenantDto(tenant));
  }

  public async createTenant(input: CreateSystemTenantRequestDto): Promise<SystemTenantResponseDto> {
    const slug = this.validateSlug(input.slug);
    const email = normalizeEmail(input.ownerEmail);
    const ownerRole = input.ownerRole ?? IDENTITY_TENANT_ROLE.OWNER;

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const tenants = manager.getRepository(TenantEntity);
      const existingTenant = await tenants.findOne({ where: { slug } });
      if (existingTenant) {
        throw new ConflictException("Tenant slug is already in use.");
      }

      const tenant = await tenants.save(
        tenants.create({
          name: input.name.trim(),
          slug,
          active: true,
        }),
      );
      const user = await this.findOrCreatePendingUser(
        email,
        manager.getRepository(IdentityUserEntity),
      );
      const memberships = manager.getRepository(TenantMembershipEntity);
      await memberships.save(
        memberships.create({
          tenantId: tenant.id,
          userId: user.id,
          roles: [ownerRole],
          active: true,
        }),
      );

      return this.getTenantDtoOrThrow(tenant.id, tenants);
    });
  }

  public async updateTenant(
    id: string,
    input: UpdateSystemTenantRequestDto,
  ): Promise<SystemTenantResponseDto> {
    if (input.name === undefined && input.slug === undefined && input.active === undefined) {
      throw new BadRequestException("At least one tenant field is required.");
    }

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const tenants = manager.getRepository(TenantEntity);
      const tenant = await tenants.findOne({ where: { id } });
      if (!tenant) {
        throw new NotFoundException("Tenant not found.");
      }

      if (input.name !== undefined) {
        tenant.name = input.name.trim();
      }

      if (input.slug !== undefined) {
        const slug = this.validateSlug(input.slug);
        const existingTenant = await tenants.findOne({ where: { slug, id: Not(id) } });
        if (existingTenant) {
          throw new ConflictException("Tenant slug is already in use.");
        }
        tenant.slug = slug;
      }

      if (input.active !== undefined) {
        tenant.active = input.active;
      }

      await tenants.save(tenant);
      return this.getTenantDtoOrThrow(id, tenants);
    });
  }

  public async listMemberships(tenantId: string): Promise<SystemMembershipResponseDto[]> {
    await this.getTenantOrThrow(tenantId);
    const memberships = await this.memberships.find({
      where: { tenantId },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });

    return memberships.map((membership) => this.toMembershipDto(membership));
  }

  public async upsertMembership(
    tenantId: string,
    input: CreateSystemMembershipRequestDto,
  ): Promise<SystemMembershipResponseDto> {
    const email = normalizeEmail(input.email);
    const roles = assertTenantRoles(input.roles);

    return this.dataSource.transaction(async (manager) => {
      await this.getTenantOrThrow(tenantId, manager.getRepository(TenantEntity));
      const user = await this.findOrCreatePendingUser(
        email,
        manager.getRepository(IdentityUserEntity),
      );
      const memberships = manager.getRepository(TenantMembershipEntity);
      const existingMembership = await memberships.findOne({
        where: { tenantId, userId: user.id },
        relations: { user: true },
      });

      if (existingMembership) {
        existingMembership.roles = roles;
        existingMembership.active = true;
        return this.toMembershipDto(await memberships.save(existingMembership));
      }

      const membership = memberships.create({
        tenantId,
        userId: user.id,
        roles,
        active: true,
        user,
      });
      return this.toMembershipDto(await memberships.save(membership));
    });
  }

  public async updateMembership(
    tenantId: string,
    membershipId: string,
    input: UpdateSystemMembershipRequestDto,
  ): Promise<SystemMembershipResponseDto> {
    if (input.roles === undefined && input.active === undefined) {
      throw new BadRequestException("At least one membership field is required.");
    }

    return this.dataSource.transaction(async (manager) => {
      await this.getTenantOrThrow(tenantId, manager.getRepository(TenantEntity));
      const memberships = manager.getRepository(TenantMembershipEntity);
      const membership = await this.getMembershipOrThrow(tenantId, membershipId, memberships);

      if (input.roles !== undefined) {
        membership.roles = assertTenantRoles(input.roles);
      }
      if (input.active !== undefined) {
        membership.active = input.active;
      }

      await memberships.save(membership);
      await this.assertTenantKeepsAdmin(tenantId, memberships);
      return this.toMembershipDto(
        await this.getMembershipOrThrow(tenantId, membershipId, memberships),
      );
    });
  }

  public async deactivateMembership(tenantId: string, membershipId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await this.getTenantOrThrow(tenantId, manager.getRepository(TenantEntity));
      const memberships = manager.getRepository(TenantMembershipEntity);
      const membership = await this.getMembershipOrThrow(tenantId, membershipId, memberships);
      membership.active = false;
      await memberships.save(membership);
      await this.assertTenantKeepsAdmin(tenantId, memberships);
    });
  }

  private validateSlug(slug: string): string {
    return assertTenantSlugAllowed(
      slug,
      this.config.getOrThrow<string[]>("RESERVED_TENANT_SUBDOMAINS"),
    );
  }

  private async findOrCreatePendingUser(
    email: string,
    users: Repository<IdentityUserEntity> = this.users,
  ): Promise<IdentityUserEntity> {
    const existingUser = await users.findOne({ where: { email } });
    if (existingUser) {
      return existingUser;
    }

    return users.save(
      users.create({
        googleSubject: null,
        email,
        displayName: null,
        avatarUrl: null,
        active: true,
      }),
    );
  }

  private async getTenantOrThrow(
    tenantId: string,
    tenants: Repository<TenantEntity> = this.tenants,
  ): Promise<TenantEntity> {
    const tenant = await tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException("Tenant not found.");
    }

    return tenant;
  }

  private async getTenantDtoOrThrow(
    tenantId: string,
    tenants: Repository<TenantEntity> = this.tenants,
  ): Promise<SystemTenantResponseDto> {
    const tenant = await tenants.findOne({
      where: { id: tenantId },
      relations: { memberships: { user: true } },
    });
    if (!tenant) {
      throw new NotFoundException("Tenant not found.");
    }

    return this.toTenantDto(tenant);
  }

  private async getMembershipOrThrow(
    tenantId: string,
    membershipId: string,
    memberships: Repository<TenantMembershipEntity> = this.memberships,
  ): Promise<TenantMembershipEntity> {
    const membership = await memberships.findOne({
      where: { id: membershipId, tenantId },
      relations: { user: true },
    });
    if (!membership) {
      throw new NotFoundException("Membership not found.");
    }

    return membership;
  }

  private async assertTenantKeepsAdmin(
    tenantId: string,
    memberships: Repository<TenantMembershipEntity> = this.memberships,
  ): Promise<void> {
    const activeMemberships = await memberships.find({ where: { tenantId, active: true } });
    if (!activeMemberships.some((membership) => hasTenantAdminRole(membership.roles))) {
      throw new BadRequestException("Tenant must keep at least one active owner or admin.");
    }
  }

  private toTenantDto(tenant: TenantEntity): SystemTenantResponseDto {
    const memberships = tenant.memberships ?? [];
    const activeMemberships = memberships.filter((membership) => membership.active);
    const ownerAdminEmails = activeMemberships
      .filter((membership) => hasTenantAdminRole(membership.roles))
      .map((membership) => membership.user.email)
      .sort();

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      active: tenant.active,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      activeMembershipCount: activeMemberships.length,
      ownerAdminEmails,
    };
  }

  private toMembershipDto(membership: TenantMembershipEntity): SystemMembershipResponseDto {
    return {
      id: membership.id,
      tenantId: membership.tenantId,
      userId: membership.userId,
      email: membership.user.email,
      roles: membership.roles,
      active: membership.active,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
