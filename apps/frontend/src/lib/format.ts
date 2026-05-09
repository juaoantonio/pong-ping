export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRoles(roles: readonly string[]) {
  return roles
    .map((role) => {
      if (role === "owner") return "Dono";
      if (role === "admin") return "Admin";
      return "Membro";
    })
    .join(", ");
}
