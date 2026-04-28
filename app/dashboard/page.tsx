import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainNav } from "@/components/main-nav";
import { RoomAdmin } from "@/app/admin/superadmin/room-admin";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireAuth();
  const rooms = await prisma.pingPongRoom.findMany({
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
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user.name ?? user.email ?? "Usuario"} src={user.image} />
            <div>
              <p className="text-sm text-muted-foreground">Sessao ativa</p>
              <h1 className="text-2xl font-semibold">{user.name ?? "Usuario"}</h1>
            </div>
          </div>
          <MainNav role={user.role} />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Area autenticada</CardTitle>
            <CardDescription>Dados validados no backend a partir da sessao HTTP-only.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex flex-col gap-1 rounded-md bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salas ativas</CardTitle>
            <CardDescription>
              Veja quem esta na fila, quem esta jogando agora e o historico recente das salas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoomAdmin
              canManage={false}
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
              users={[]}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
