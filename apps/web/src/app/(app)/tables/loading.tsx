import {
  PageHeaderSkeleton,
  TablesGridSkeleton,
} from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-32" />
      </div>
      <TablesGridSkeleton />
    </div>
  );
}
