import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { MatchesAdmin } from "@/app/admin/matches/matches-admin";

export default async function AdminMatchesPage() {
  const currentUser = await requireRole("admin");
  const [users, recentMatches] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        winnerOldElo: true,
        winnerNewElo: true,
        loserOldElo: true,
        loserNewElo: true,
        createdAt: true,
        winner: { select: { name: true, email: true } },
        loser: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.name ?? currentUser.email ?? "Usuario"} src={currentUser.avatarUrl ?? currentUser.image} />
            <div>
              <p className="text-sm text-muted-foreground">Painel administrativo</p>
              <h1 className="text-2xl font-semibold">Partidas</h1>
            </div>
          </div>
          <MainNav role={currentUser.role} />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Finalizar partida</CardTitle>
            <CardDescription>Selecione dois usuarios cadastrados e defina o vencedor.</CardDescription>
          </CardHeader>
          <CardContent>
            <MatchesAdmin
              users={users}
              recentMatches={recentMatches.map((match) => ({
                ...match,
                createdAt: match.createdAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
