import { NextResponse } from "next/server";
import type {
  AthleteGripStyle,
  AthletePlayingStyle,
  AthleteTechnicalLevel,
} from "@prisma/client";
import {
  getCurrentUser,
  requireAuth,
  toClientAuthenticatedUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const TECHNICAL_LEVELS = new Set([
  "beginner",
  "intermediate",
  "advanced",
  "competitive",
]);
const GRIP_STYLES = new Set(["classic", "penhold"]);
const PLAYING_STYLES = new Set(["offensive", "defensive", "all_round"]);

function parseOptionalEnum(
  value: unknown,
  allowedValues: Set<string>,
  error: string,
) {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value === "string" && allowedValues.has(value)) {
    return { value };
  }

  return { error };
}

function parseOptionalText(value: unknown, maxLength: number, error: string) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length > maxLength) {
    return { error };
  }

  return { value: trimmedValue.length > 0 ? trimmedValue : null };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: toClientAuthenticatedUser(user) });
}

export async function PATCH(request: Request) {
  const user = await requireAuth();
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    technicalLevel?: unknown;
    gripStyle?: unknown;
    playingStyle?: unknown;
    bladeName?: unknown;
    forehandRubberName?: unknown;
    backhandRubberName?: unknown;
    equipmentNotes?: unknown;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "O nome deve ter entre 2 e 80 caracteres." },
      { status: 400 },
    );
  }

  if (!user.tenantId) {
    return NextResponse.json(
      { error: "Contexto do tenant obrigatorio." },
      { status: 403 },
    );
  }

  const technicalLevel = parseOptionalEnum(
    body?.technicalLevel,
    TECHNICAL_LEVELS,
    "Nivel tecnico invalido.",
  );
  const gripStyle = parseOptionalEnum(
    body?.gripStyle,
    GRIP_STYLES,
    "Empunhadura invalida.",
  );
  const playingStyle = parseOptionalEnum(
    body?.playingStyle,
    PLAYING_STYLES,
    "Estilo de jogo invalido.",
  );
  const bladeName = parseOptionalText(
    body?.bladeName,
    120,
    "Madeira deve ter no maximo 120 caracteres.",
  );
  const forehandRubberName = parseOptionalText(
    body?.forehandRubberName,
    120,
    "Borracha forehand deve ter no maximo 120 caracteres.",
  );
  const backhandRubberName = parseOptionalText(
    body?.backhandRubberName,
    120,
    "Borracha backhand deve ter no maximo 120 caracteres.",
  );
  const equipmentNotes = parseOptionalText(
    body?.equipmentNotes,
    500,
    "Observacoes devem ter no maximo 500 caracteres.",
  );

  const validationError =
    technicalLevel.error ??
    gripStyle.error ??
    playingStyle.error ??
    bladeName.error ??
    forehandRubberName.error ??
    backhandRubberName.error ??
    equipmentNotes.error;

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const athleteProfileData = {
    technicalLevel: (technicalLevel.value ??
      null) as AthleteTechnicalLevel | null,
    gripStyle: (gripStyle.value ?? null) as AthleteGripStyle | null,
    playingStyle: (playingStyle.value ?? null) as AthletePlayingStyle | null,
    bladeName: bladeName.value ?? null,
    forehandRubberName: forehandRubberName.value ?? null,
    backhandRubberName: backhandRubberName.value ?? null,
    equipmentNotes: equipmentNotes.value ?? null,
  };

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
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
    }),
    prisma.athleteProfile.upsert({
      where: {
        userId: user.id,
      },
      create: {
        tenantId: user.tenantId,
        userId: user.id,
        ...athleteProfileData,
      },
      update: athleteProfileData,
    }),
  ]);

  return NextResponse.json({ user: toClientAuthenticatedUser(updatedUser) });
}
