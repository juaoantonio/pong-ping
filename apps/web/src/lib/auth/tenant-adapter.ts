import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { normalizeEmail } from "@/lib/auth/access";
import {
  getPendingTenantCookie,
  type PendingTenant,
} from "@/lib/auth/pending-tenant";
import { prisma } from "@/lib/prisma";

type PrismaLike = PrismaClient | ReturnType<PrismaClient["$extends"]>;

type TenantAwareAdapterOptions = {
  getPendingTenant?: () => Promise<PendingTenant | null>;
};

function stripUndefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

async function requirePendingTenant(
  operation: string,
  getPendingTenant: () => Promise<PendingTenant | null>,
) {
  const pendingTenant = await getPendingTenant();

  if (!pendingTenant) {
    throw new Error(`Missing pending tenant context for Auth.js ${operation}.`);
  }

  return pendingTenant;
}

export function TenantAwarePrismaAdapter(
  prismaClient: PrismaLike = prisma,
  options: TenantAwareAdapterOptions = {},
): Adapter {
  const baseAdapter = PrismaAdapter(prismaClient);
  const p = prismaClient as typeof prisma;
  const getPendingTenant = options.getPendingTenant ?? getPendingTenantCookie;

  return {
    ...baseAdapter,

    async getUserByEmail(email) {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        return null;
      }

      const pendingTenant = await requirePendingTenant("getUserByEmail", getPendingTenant);

      return p.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: pendingTenant.tenantId,
            email: normalizedEmail,
          },
        },
      }) as Promise<AdapterUser | null>;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const pendingTenant = await requirePendingTenant(
        "getUserByAccount",
        getPendingTenant,
      );

      const account = await p.account.findUnique({
        where: {
          tenantId_provider_providerAccountId: {
            tenantId: pendingTenant.tenantId,
            provider,
            providerAccountId,
          },
        },
        include: {
          user: true,
        },
      });

      return (account?.user ?? null) as AdapterUser | null;
    },

    async createUser(user) {
      const { id, ...userData } = user;
      void id;
      const pendingTenant = await requirePendingTenant("createUser", getPendingTenant);
      const email = normalizeEmail(userData.email);

      return p.user.create({
        data: stripUndefined({
          ...userData,
          email,
          tenantId: pendingTenant.tenantId,
        }) as never,
      }) as Promise<AdapterUser>;
    },

    async linkAccount(account) {
      const pendingTenant = await requirePendingTenant("linkAccount", getPendingTenant);

      return p.account.create({
        data: stripUndefined({
          ...account,
          tenantId: pendingTenant.tenantId,
        }) as never,
      }) as Promise<AdapterAccount>;
    },

    async getAccount(providerAccountId, provider) {
      const pendingTenant = await requirePendingTenant("getAccount", getPendingTenant);

      return p.account.findUnique({
        where: {
          tenantId_provider_providerAccountId: {
            tenantId: pendingTenant.tenantId,
            provider,
            providerAccountId,
          },
        },
      }) as Promise<AdapterAccount | null>;
    },
  };
}
