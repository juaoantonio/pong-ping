import { NextResponse } from "next/server";
import { getCurrentUser, requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
      role: user.role,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await requireAuth();
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "O nome deve ter entre 2 e 80 caracteres." },
      { status: 400 },
    );
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      avatarUrl: true,
      role: true,
    },
  });

  return NextResponse.json({
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl ?? updatedUser.image,
      role: updatedUser.role,
    },
  });
}
