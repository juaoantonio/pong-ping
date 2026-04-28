"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [loading, startTransition] = useTransition();

  return (
    <Button
      disabled={loading}
      onClick={() => {
        startTransition(async () => {
          await logout();
        });
      }}
      variant="outline"
    >
      <LogOut className="size-4" />
      {loading ? "Saindo..." : "Sair"}
    </Button>
  );
}
