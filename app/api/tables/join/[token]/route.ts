import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { claimTableInvitation } from "@/lib/contexts/invitations";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { token } = await context.params;

  const result = await claimTableInvitation(prisma, {
    token,
    userId: actor.id,
  });

  if (!result.ok && result.error.code === "table_not_found") {
    return NextResponse.json(
      { error: "Mesa nao encontrada." },
      { status: 404 },
    );
  }

  if (!result.ok && result.error.code === "invitation_not_found") {
    return NextResponse.json(
      { error: "Convite de mesa invalido." },
      { status: 404 },
    );
  }

  if (!result.ok && result.error.code === "invitation_expired") {
    return NextResponse.json(
      { error: "Este convite de mesa expirou." },
      { status: 400 },
    );
  }

  if (!result.ok && result.error.code === "invitation_used") {
    return NextResponse.json(
      { error: "Este convite de mesa ja foi utilizado." },
      { status: 400 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: "Convite de mesa invalido, expirado ou ja utilizado." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, tableId: result.value.tableId });
}
