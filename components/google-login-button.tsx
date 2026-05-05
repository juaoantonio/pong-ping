"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_TENANT_SLUG } from "@/lib/auth/login-tenant";

export function GoogleLoginButton({
  tenantSlug = DEFAULT_LOGIN_TENANT_SLUG,
}: {
  tenantSlug?: string;
}) {
  const [loading, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={loading}
      onClick={() => {
        startTransition(async () => {
          await signInWithGoogle(tenantSlug);
        });
      }}
      size="lg"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <KeyRound className="size-4" aria-hidden="true" />
      )}
      Entrar com Google
    </Button>
  );
}
