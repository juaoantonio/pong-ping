import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { EmptyState, PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
});

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
  const podium = result.rankings.slice(0, 3);

  return (
    <section className="grid gap-5">
      {podium.length > 0 ? (
        <div className="overflow-hidden border-y border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--accent)_14%,transparent),transparent_55%),linear-gradient(180deg,color-mix(in_oklch,var(--muted)_55%,transparent),transparent)]">
          <div className="grid md:grid-cols-3">
            {podium.map((user, index) => (
              <article
                className={cn(
                  "grid min-w-0 gap-4 px-4 py-5 md:px-5",
                  index === 0 && "bg-accent/10",
                  index < podium.length - 1 &&
                    "border-b border-border/70 md:border-r md:border-b-0",
                )}
                key={user.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    #{rankingOffset + index + 1}
                  </Badge>
                  <span className="text-2xl font-semibold tabular-nums">
                    {integerFormatter.format(user.ranking.elo)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">
                    {user.name ?? "Sem nome"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email ?? "Sem email"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vitórias</p>
                    <p className="font-semibold tabular-nums">
                      {integerFormatter.format(user.ranking.wins)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Partidas</p>
                    <p className="font-semibold tabular-nums">
                      {integerFormatter.format(user.ranking.total_matches)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Aproveit.</p>
                    <p className="font-semibold tabular-nums">
                      {percentFormatter.format(user.ranking.winRate / 100)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-3 pb-4 md:flex md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Classificação Geral</h2>
            <p className="text-sm text-muted-foreground">
              Ranking público por Elo, vitórias e aproveitamento.
            </p>
          </div>
          <Badge variant="outline">
            {integerFormatter.format(result.pageInfo.totalCount)} jogadores
          </Badge>
        </div>

        <div className="divide-y border-y border-border/80 md:hidden">
          {result.rankings.map((user, index) => (
            <article className="grid min-w-0 gap-3 px-1 py-4" key={user.id}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    #{rankingOffset + index + 1} {user.name ?? "Sem nome"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email ?? "Sem email"}
                  </p>
                </div>
                <Badge variant="secondary">
                  {integerFormatter.format(user.ranking.elo)} Elo
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                <span>
                  {integerFormatter.format(user.ranking.wins)} vitórias
                </span>
                <span>
                  {integerFormatter.format(user.ranking.total_matches)} partidas
                </span>
                <span>
                  {percentFormatter.format(user.ranking.winRate / 100)}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead className="text-right">Elo</TableHead>
                <TableHead className="text-right">Vitórias</TableHead>
                <TableHead className="text-right">Partidas</TableHead>
                <TableHead className="text-right">Aproveitamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rankings.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold">
                    {integerFormatter.format(rankingOffset + index + 1)}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
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
                      <Badge variant="outline">Sem nível</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {integerFormatter.format(user.ranking.elo)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {integerFormatter.format(user.ranking.wins)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {integerFormatter.format(user.ranking.total_matches)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {percentFormatter.format(user.ranking.winRate / 100)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {result.rankings.length === 0 ? (
          <EmptyState title="Nenhum jogador no ranking">
            Quando a primeira rodada for finalizada, os jogadores aparecem aqui
            com Elo, vitórias e aproveitamento.
          </EmptyState>
        ) : null}

        <PaginationControls
          itemLabel="jogadores"
          pageInfo={result.pageInfo}
          pathname="/"
          searchParams={searchParams}
        />
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const tenant = await getTenantFromRequestHost();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_22%,transparent),transparent_32rem),var(--background)] px-4 py-8">
      <PageShell
        action={
          <Suspense fallback={<HeaderActionSkeleton />}>
            <HomeAction tenant={tenant} />
          </Suspense>
        }
        description="Acompanhe quem está liderando a mesa: Elo, volume de partidas e aproveitamento em uma leitura rápida."
        eyebrow={tenant?.name ?? "Pong Ping"}
        title="Ranking"
      >
        <Suspense fallback={<RankingTableSkeleton />}>
          <RankingTable searchParams={params} tenant={tenant} />
        </Suspense>
      </PageShell>
    </main>
  );
}
