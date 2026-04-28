import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { RoomAdmin } from "@/app/admin/superadmin/room-admin";

export default async function AdminSuperadminPage() {
  const currentUser = await requireRole("admin");
  const [users, rooms] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        image: true,
      },
    }),
    prisma.pingPongRoom.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        invitations: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            token: true,
            expiresAt: true,
          },
        },
        participants: {
          orderBy: { queuePosition: "asc" },
          select: {
            id: true,
            queuePosition: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                image: true,
                playerRanking: {
                  select: {
                    elo: true,
                    wins: true,
                    total_matches: true,
                    winRate: true,
                  },
                },
              },
            },
          },
        },
        matches: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            createdAt: true,
            winnerOldElo: true,
            winnerNewElo: true,
            loserOldElo: true,
            loserNewElo: true,
            winner: {
              select: {
                name: true,
                email: true,
                avatarUrl: true,
                image: true,
              },
            },
            loser: {
              select: {
                name: true,
                email: true,
                avatarUrl: true,
                image: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.name ?? currentUser.email ?? "Usuario"} src={currentUser.avatarUrl ?? currentUser.image} />
            <div>
              <p className="text-sm text-muted-foreground">Painel administrativo</p>
              <h1 className="text-2xl font-semibold">Salas de ping pong</h1>
            </div>
          </div>
          <MainNav role={currentUser.role} />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Fila por sala</CardTitle>
            <CardDescription>
              Crie salas, convide jogadores por link, adicione participantes manualmente e finalize rodadas com recalculo de Elo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoomAdmin
              rooms={rooms.map((room) => ({
                id: room.id,
                name: room.name,
                createdAt: room.createdAt.toISOString(),
                createdBy: room.createdBy,
                currentInvitation: room.invitations[0]
                  ? {
                      id: room.invitations[0].id,
                      token: room.invitations[0].token,
                      expiresAt: room.invitations[0].expiresAt.toISOString(),
                    }
                  : null,
                participants: room.participants.map((participant) => ({
                  id: participant.id,
                  queuePosition: participant.queuePosition,
                  joinedAt: participant.joinedAt.toISOString(),
                  user: {
                    id: participant.user.id,
                    name: participant.user.name,
                    email: participant.user.email,
                    avatarUrl: participant.user.avatarUrl ?? participant.user.image,
                    playerRanking: participant.user.playerRanking,
                  },
                })),
                recentMatches: room.matches.map((match) => ({
                  id: match.id,
                  createdAt: match.createdAt.toISOString(),
                  winnerOldElo: match.winnerOldElo,
                  winnerNewElo: match.winnerNewElo,
                  loserOldElo: match.loserOldElo,
                  loserNewElo: match.loserNewElo,
                  winner: {
                    ...match.winner,
                    avatarUrl: match.winner.avatarUrl ?? match.winner.image,
                  },
                  loser: {
                    ...match.loser,
                    avatarUrl: match.loser.avatarUrl ?? match.loser.image,
                  },
                })),
              }))}
              users={users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl ?? user.image,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
