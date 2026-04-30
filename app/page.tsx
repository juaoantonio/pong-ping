import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HeaderActionSkeleton,
  RankingTableSkeleton,
} from "@/components/page-skeletons";
import { getPublicRankings } from "@/lib/rankings/queries";
import { cn } from "@/lib/utils";

async function HomeAction() {
  const session = await auth();

  return (
    <Link
      className={cn(buttonVariants({ variant: "outline" }))}
      href={session?.user ? "/tables" : "/login"}
    >
      {session?.user ? "Mesas" : "Login"}
    </Link>
  );
}

async function RankingTable() {
  const rankings = await getPublicRankings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classificacao geral</CardTitle>
        <CardDescription>
          Ranking publico por Elo, vitorias e aproveitamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead className="text-right">Elo</TableHead>
              <TableHead className="text-right">Vitorias</TableHead>
              <TableHead className="text-right">Partidas</TableHead>
              <TableHead className="text-right">Win rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-semibold">{index + 1}</TableCell>
                <TableCell>
                  <div className="min-w-44">
                    <p className="truncate font-medium">
                      {user.name ?? "Sem nome"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email ?? "Sem email"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {user.rankLevel ? (
                    <div className="flex items-center gap-2">
                      {user.rankIconExists ? (
                        <Image
                          alt=""
                          className="size-7 rounded-sm object-contain"
                          height={28}
                          src={`/${user.rankLevel.iconImgKey}`}
                          width={28}
                        />
                      ) : null}
                      <Badge variant="secondary">{user.rankLevel.name}</Badge>
                    </div>
                  ) : (
                    <Badge variant="outline">Sem nivel</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {user.ranking.elo}
                </TableCell>
                <TableCell className="text-right">
                  {user.ranking.wins}
                </TableCell>
                <TableCell className="text-right">
                  {user.ranking.total_matches}
                </TableCell>
                <TableCell className="text-right">
                  {user.ranking.winRate.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rankings.length === 0 ? (
          <div className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum jogador cadastrado.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pong Ping</p>
            <h1 className="text-3xl font-semibold">Ranking</h1>
          </div>
          <Suspense fallback={<HeaderActionSkeleton />}>
            <HomeAction />
          </Suspense>
        </header>

        <Suspense fallback={<RankingTableSkeleton />}>
          <RankingTable />
        </Suspense>
      </div>
    </main>
  );
}
