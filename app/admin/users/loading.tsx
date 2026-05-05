import {
  DataRegionSkeleton,
  PageHeaderSkeleton,
} from "@/components/page-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeaderSkeleton />
      <DataRegionSkeleton rows={6} />
    </div>
  );
}
