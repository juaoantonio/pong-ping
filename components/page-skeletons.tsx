import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HeaderActionSkeleton() {
  return <Skeleton className="h-10 w-24" />;
}

export function RankingTableSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="grid gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={index} />
        ))}
      </CardContent>
    </Card>
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

export function CardTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={index} />
        ))}
      </CardContent>
    </Card>
  );
}

export function RoomsGridSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RoomDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,3fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-24 w-full" key={index} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="hidden h-10 w-12 md:block" />
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
      <CardTableSkeleton rows={4} />
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
      <CardTableSkeleton rows={2} />
      <CardTableSkeleton rows={2} />
    </div>
  );
}
