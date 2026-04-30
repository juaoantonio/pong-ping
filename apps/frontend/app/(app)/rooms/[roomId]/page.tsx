import { notFound } from "next/navigation";
import { RoomDetail } from "@/components/rooms/room-detail";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { getRoomDetail, getRoomUserOptions } from "@/lib/rooms/queries";

type RoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const user = await requireAuth();
  const { roomId } = await params;
  const room = await getRoomDetail(roomId);

  if (!room) {
    notFound();
  }

  const canManage = canAccessAdmin(user.role);
  const users = canManage ? await getRoomUserOptions() : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <RoomDetail canManage={canManage} room={room} users={users} />
    </div>
  );
}
