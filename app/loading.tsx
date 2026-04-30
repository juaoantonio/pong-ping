import { HeaderActionSkeleton, RankingTableSkeleton } from "@/components/page-skeletons";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pong Ping</p>
            <h1 className="text-3xl font-semibold">Ranking</h1>
          </div>
          <HeaderActionSkeleton />
        </header>
        <RankingTableSkeleton />
      </div>
    </main>
  );
}
