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
  const userPromise = requireAuth();
  const paramsPromise = params;

  const [user, { roomId }] = await Promise.all([userPromise, paramsPromise]);
  const room = await getRoomDetail(roomId, user.id);

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
