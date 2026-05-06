export async function readApiError(
  response: Response,
  fallback = "Nao foi possivel concluir a acao.",
) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function userLabel(user: {
  email?: string | null;
  name?: string | null;
}) {
  return user.name ?? user.email ?? "Usuario";
}
