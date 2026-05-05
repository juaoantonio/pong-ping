import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeLoginTenantSlug } from "@/lib/auth/login-tenant";
import { prisma } from "@/lib/prisma";
import { buildTenantUrlFromRequest } from "@/lib/tenants/request";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:
    "Não foi possível concluir o login com Google. Tente entrar novamente.",
  oauth_state_invalid: "A sessão de login expirou. Tente entrar novamente.",
  access_denied:
    "O acesso pelo Google foi cancelado. Use o botão abaixo para tentar novamente.",
  email_not_allowed:
    "Este email ainda não foi autorizado. Peça acesso a um admin.",
  tenant_required:
    "Link de tenant ausente. Use um link de login válido ou entre no tenant padrão.",
  tenant_not_found:
    "Tenant não encontrado. Confira o link ou peça um novo convite a um admin.",
  tenant_context_required:
    "A sessão de tenant expirou. Tente entrar novamente.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    tenant?: string | string[];
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
  const errorKey = typeof params.error === "string" ? params.error : null;
  const error = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.oauth_failed)
    : null;
  const tenantSlug = normalizeLoginTenantSlug(params.tenant);
  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: tenantSlug },
      select: { name: true, slug: true },
    })
    .catch(() => null);
  const tenantName = tenant?.name ?? "Pong Ping";
  const signInForTenant = signInWithGoogle.bind(null, tenantSlug);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,color-mix(in_oklch,var(--accent)_34%,transparent),transparent_42%),var(--background)] px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="min-w-0 space-y-8">
          <div className="space-y-4">
            <Badge className="rounded-md px-3 py-1" variant="secondary">
              Pong Ping
            </Badge>
            <div className="max-w-3xl space-y-4">
              <h1 className="font-display text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
                Bem-vindo ao {tenantName}.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty sm:text-lg">
                Entre para acompanhar mesas, rankings e partidas do seu clube.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-3 rounded-md border border-primary/20 bg-card/70 p-4 shadow-sm">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">Organização</p>
                <p className="wrap-break-word font-display text-2xl font-semibold">
                  {tenantName}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use sua conta Google autorizada para continuar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full rounded-md border border-border bg-card p-5 shadow-md sm:p-6">
          <div className="mb-6 space-y-2">
            <p className="font-display text-2xl font-semibold">Acesso Seguro</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Continue com Google para entrar.
            </p>
          </div>

          {error ? (
            <Alert aria-live="polite" className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={signInForTenant} className="grid gap-4">
            <Button className="h-12 w-full text-base" size="lg" type="submit">
              <KeyRound className="size-4" aria-hidden="true" />
              Entrar com Google
            </Button>
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Precisa de acesso? Peça um convite ao admin do clube.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
