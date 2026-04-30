import { CardTableSkeleton } from "@/components/page-skeletons";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <CardTableSkeleton rows={2} />
      </div>
    </main>
  );
}
