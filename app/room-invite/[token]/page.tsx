import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { RoomInviteForm } from "@/app/room-invite/[token]/room-invite-form";

type RoomInvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function RoomInvitePage({ params }: RoomInvitePageProps) {
  const currentUser = await requireAuth();
  const { token } = await params;

  const invitation = await prisma.pingPongRoomInvitation.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      room: {
        select: {
          id: true,
          name: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!invitation) {
    notFound();
  }

  const creatorName =
    invitation.room.createdBy.name ?? invitation.room.createdBy.email ?? "Criador da sala";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Entrar na sala</CardTitle>
          <CardDescription>
            {currentUser.name ?? currentUser.email ?? "Usuario"}, voce foi convidado para a sala{" "}
            <strong>{invitation.room.name}</strong> criada por {creatorName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RoomInviteForm
            expiresAt={invitation.expiresAt.toISOString()}
            roomName={invitation.room.name}
            token={token}
          />
          <Link className={buttonVariants({ variant: "ghost" })} href="/dashboard">
            Voltar ao dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
