import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/auth/access";
import { claimAccessInvitation } from "@/lib/contexts/invitations";

type RouteParams = {
  params: Promise<{
    token: string;
  }>;
};

type InvitationRequestBody = {
  email?: unknown;
};

export async function POST(request: Request, context: RouteParams) {
  const { token } = await context.params;
  const body = (await request
    .json()
    .catch(() => null)) as InvitationRequestBody | null;

  if (typeof body?.email !== "string") {
    return NextResponse.json(
      { error: "Informe um email valido." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Informe um email valido." },
      { status: 400 },
    );
  }

  const result = await claimAccessInvitation(prisma, {
    email,
    token,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Convite invalido, expirado ou ja utilizado." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, email });
}
