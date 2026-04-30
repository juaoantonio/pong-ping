import { CardTableSkeleton, PageHeaderSkeleton } from "@/components/page-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeaderSkeleton />
      <CardTableSkeleton rows={5} />
    </div>
  );
}
