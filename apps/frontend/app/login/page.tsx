import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleLoginButton } from "@/components/google-login-button";
import { getCurrentUser } from "@/lib/auth/session";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Nao foi possivel concluir o login com Google.",
  oauth_state_invalid: "A sessao de login expirou. Tente novamente.",
  access_denied: "O acesso pelo Google foi cancelado.",
  email_not_allowed: "Este email ainda nao foi autorizado por um admin.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/rooms");
  }

  const params = await searchParams;
  const error = params.error ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.oauth_failed) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--background)_0%,var(--muted)_52%,var(--accent)_100%)] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pong Ping</CardTitle>
          <CardDescription>Entre para acessar sua area autenticada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <GoogleLoginButton />
        </CardContent>
      </Card>
    </main>
  );
}
