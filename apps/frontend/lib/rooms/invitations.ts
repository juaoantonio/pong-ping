import crypto from "node:crypto";

export function createRoomInvitationToken() {
  return crypto.randomBytes(24).toString("hex");
}
