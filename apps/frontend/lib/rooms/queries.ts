import "server-only";

import type { RoomListItem, RoomSummary, UserOption } from "@/components/rooms/types";
import { apiGet } from "@/lib/api/server";

export async function getRoomListItems() {
  return apiGet<RoomListItem[]>("/rooms");
}

export async function getRoomDetail(roomId: string) {
  try {
    const data = await apiGet<{ room: RoomSummary }>(`/rooms/${roomId}`);
    return data.room;
  } catch {
    return null;
  }
}

export async function getRoomUserOptions() {
  const data = await apiGet<{ users: UserOption[] }>("/rooms/user-options");
  return data.users;
}
