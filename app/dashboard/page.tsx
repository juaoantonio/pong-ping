import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user.name ?? user.email ?? "Usuario"} src={user.image} />
            <div>
              <p className="text-sm text-muted-foreground">Sessao ativa</p>
              <h1 className="text-2xl font-semibold">{user.name ?? "Usuario"}</h1>
            </div>
          </div>
          <LogoutButton />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Area autenticada</CardTitle>
            <CardDescription>Dados validados no backend a partir da sessao HTTP-only.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex flex-col gap-1 rounded-md bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
