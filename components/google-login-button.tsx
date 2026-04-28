"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function GoogleLoginButton() {
  const [loading, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={loading}
      onClick={() => {
        startTransition(async () => {
          await signInWithGoogle();
        });
      }}
      size="lg"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
      Entrar com Google
    </Button>
  );
}
