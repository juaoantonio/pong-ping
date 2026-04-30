import { RoomDetailSkeleton } from "@/components/page-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <RoomDetailSkeleton />
    </div>
  );
}
