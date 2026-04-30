import type { ApiResponse } from "@pong-ping/shared";

export function publicApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
}

export async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | ApiResponse<unknown>
    | { error?: string }
    | null;

  if (body && "ok" in body && body.ok === false) {
    return body.error.message;
  }

  if (body && "error" in body && typeof body.error === "string") {
    return body.error;
  }

  return "Nao foi possivel concluir a acao.";
}
