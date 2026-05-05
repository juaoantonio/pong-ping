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
    <div className="grid gap-8">
      <Skeleton className="h-9 w-36" />

      <section className="border-y border-border py-5 md:py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <div className="grid min-w-0 gap-5">
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-8 w-64 max-w-full" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            </div>

            <div className="grid border-y border-border md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:divide-x md:divide-border">
              <div className="grid min-h-48 content-between gap-5 py-5 md:px-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="grid justify-items-center gap-4">
                  <Skeleton className="size-24 rounded-full" />
                  <div className="grid w-full justify-items-center gap-2">
                    <Skeleton className="h-7 w-44 max-w-full" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                  </div>
                </div>
                <div aria-hidden="true" />
              </div>
              <div className="grid place-items-center border-y border-border py-3 md:border-y-0 md:px-4">
                <Skeleton className="h-10 w-14" />
              </div>
              <div className="grid min-h-48 content-between gap-5 py-5 md:px-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="grid justify-items-center gap-4">
                  <Skeleton className="size-24 rounded-full" />
                  <div className="grid w-full justify-items-center gap-2">
                    <Skeleton className="h-7 w-44 max-w-full" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                  </div>
                </div>
                <div aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="grid gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
            </div>
            <div className="border-t border-border pt-4">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-2 border-b border-border/80 pb-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid divide-y divide-border border-y border-border">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="grid gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              key={index}
            >
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      </section>

      <DataRegionSkeleton rows={3} />
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
