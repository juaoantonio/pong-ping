import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_shared";
import { isSuperAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

type TenantRequestBody = {
  name?: unknown;
  slug?: unknown;
};

const MAX_SLUG_ATTEMPTS = 20;

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function createUniqueTenant(name: string, preferredSlug?: string) {
  const baseSlug = slugify(preferredSlug || name) || "tenant";

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    try {
      return await prisma.tenant.create({
        data: { name, slug },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("tenant_slug_exhausted");
}

export async function GET() {
  const { actor, response } = await requireAdmin("tenant_management_forbidden");

  if (!actor) {
    return response;
  }

  if (!isSuperAdmin(actor)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return NextResponse.json({
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      userCount: tenant._count.users,
    })),
  });
}

export async function POST(request: Request) {
  const { actor, response } = await requireAdmin("tenant_management_forbidden");

  if (!actor) {
    return response;
  }

  if (!isSuperAdmin(actor)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = (await request
    .json()
    .catch(() => null)) as TenantRequestBody | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : undefined;

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Informe um nome de tenant valido." },
      { status: 400 },
    );
  }

  const tenant = await createUniqueTenant(name, slug);

  return NextResponse.json(
    {
      tenant: {
        ...tenant,
        userCount: 0,
      },
    },
    { status: 201 },
  );
}
