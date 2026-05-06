import crypto from "node:crypto";

export function createTableInvitationToken() {
  return crypto.randomBytes(24).toString("hex");
}
