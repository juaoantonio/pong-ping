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
import { PaginationControls } from "@/components/pagination-controls";
import {
  getPaginationOffset,
  parseServerPaginationParams,
} from "@/lib/pagination";
import { getPublicRankings } from "@/lib/rankings/queries";
import {
  getTenantFromRequestHost,
  buildTenantUrlFromRequest,
  type RequestTenant,
} from "@/lib/tenants/request";
import { cn } from "@/lib/utils";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function HomeAction({ tenant }: { tenant: RequestTenant | null }) {
  const session = await auth();
  const loginHref = tenant ? `/login?tenant=${tenant.slug}` : "/login";
  const tablesHref = session?.user?.tenantSlug
    ? await buildTenantUrlFromRequest("/tables", session.user.tenantSlug)
    : "/tables";

  return (
    <Link
      className={cn(buttonVariants({ variant: "outline" }))}
      href={session?.user ? tablesHref : loginHref}
    >
      {session?.user ? "Mesas" : "Login"}
    </Link>
  );
}

async function RankingTable({
  searchParams,
  tenant,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  tenant: RequestTenant | null;
}) {
  const result = await getPublicRankings(
    parseServerPaginationParams(searchParams),
    tenant?.id,
  );
  const rankingOffset = getPaginationOffset(result.pageInfo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classificacao geral</CardTitle>
        <CardDescription>
          Ranking publico por Elo, vitorias e aproveitamento.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
            {result.rankings.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-semibold">
                  {rankingOffset + index + 1}
                </TableCell>
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

        {result.rankings.length === 0 ? (
          <div className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum jogador cadastrado.
          </div>
        ) : null}

        <PaginationControls
          itemLabel="jogadores"
          pageInfo={result.pageInfo}
          pathname="/"
          searchParams={searchParams}
        />
      </CardContent>
    </Card>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const tenant = await getTenantFromRequestHost();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {tenant?.name ?? "Pong Ping"}
            </p>
            <h1 className="text-3xl font-semibold">Ranking</h1>
          </div>
          <Suspense fallback={<HeaderActionSkeleton />}>
            <HomeAction tenant={tenant} />
          </Suspense>
        </header>

        <Suspense fallback={<RankingTableSkeleton />}>
          <RankingTable searchParams={params} tenant={tenant} />
        </Suspense>
      </div>
    </main>
  );
}
