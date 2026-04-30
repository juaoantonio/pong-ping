"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiMutate } from "@/lib/api/server";
import { publicApiUrl } from "@/lib/api/client";

export async function signInWithGoogle() {
  redirect(`${publicApiUrl()}/auth/google`);
}

export async function logout() {
  await apiMutate("/auth/logout", { method: "POST" }).catch(() => undefined);
  const cookieStore = await cookies();
  cookieStore.delete("pp_access_token");
  cookieStore.delete("pp_session_token");
  redirect("/login");
}
