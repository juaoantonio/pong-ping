import { Skeleton } from "@/components/ui/skeleton";

export function HeaderActionSkeleton() {
  return <Skeleton className="h-10 w-24" />;
}

export function RankingTableSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 border-b border-border/80 pb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-0 divide-y divide-border">
        {Array.from({ length: 7 }).map((_, index) => (
          <div className="py-3" key={index}>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-56" />
    </div>
  );
}

export function DataRegionSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-5 border-t border-border pt-5">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-0 divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="py-3" key={index}>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TablesGridSkeleton() {
  return (
    <div className="grid gap-0 divide-y divide-border border-y border-border">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]"
          key={index}
        >
          <div className="grid gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="grid content-start gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,3fr)_minmax(0,7fr)]">
        <section className="grid content-start gap-4 border-t border-border pt-5">
          <div className="grid gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid gap-0 divide-y divide-border">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="py-3" key={index}>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </section>
        <section className="grid content-start gap-5 border-t border-border pt-5">
          <div>
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="hidden h-10 w-12 md:block" />
            <Skeleton className="h-72 w-full" />
          </div>
        </section>
      </div>
      <DataRegionSkeleton rows={4} />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
      <DataRegionSkeleton rows={2} />
      <DataRegionSkeleton rows={2} />
    </div>
  );
}
