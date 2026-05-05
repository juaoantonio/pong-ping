import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildTenantUrlFromRequest } from "@/lib/tenants/request";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Nao foi possivel concluir o login com Google.",
  oauth_state_invalid: "A sessao de login expirou. Tente novamente.",
  access_denied: "O acesso pelo Google foi cancelado.",
  email_not_allowed: "Este email ainda nao foi autorizado por um admin.",
  tenant_required: "Informe o tenant antes de entrar.",
  tenant_not_found: "Tenant nao encontrado.",
  tenant_context_required: "A sessao de tenant expirou. Tente novamente.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    tenant?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect(
      session.user.tenantSlug
        ? await buildTenantUrlFromRequest("/tables", session.user.tenantSlug)
        : "/tables",
    );
  }

  const params = await searchParams;
  const error = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.oauth_failed)
    : null;
  const tenantSlug = typeof params.tenant === "string" ? params.tenant : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--background)_0%,var(--muted)_52%,var(--accent)_100%)] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pong Ping</CardTitle>
          <CardDescription>
            Entre para acessar sua area autenticada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <form action={signInWithGoogle} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="tenantSlug">
                Tenant
              </label>
              <Input
                autoCapitalize="none"
                autoComplete="organization"
                autoCorrect="off"
                defaultValue={tenantSlug}
                id="tenantSlug"
                name="tenantSlug"
                placeholder="default"
                required
              />
            </div>
            <Button className="w-full" size="lg" type="submit">
              <KeyRound className="size-4" />
              Entrar com Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
