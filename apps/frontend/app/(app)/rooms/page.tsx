import { CreateRoomForm } from "@/components/rooms/create-room-form";
import { RoomList } from "@/components/rooms/room-list";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { getRoomListItems } from "@/lib/rooms/queries";

export default async function RoomsPage() {
  const user = await requireAuth();
  const rooms = await getRoomListItems();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Salas de ping pong</h1>
        </div>
        {canAccessAdmin(user.role) ? <CreateRoomForm /> : null}
      </div>

      <RoomList rooms={rooms} />
    </div>
  );
}
