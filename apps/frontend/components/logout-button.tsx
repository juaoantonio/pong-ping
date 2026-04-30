"use client";

import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  icon?: ReactNode;
};

export function LogoutButton({ icon }: LogoutButtonProps) {
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
      {icon ?? <LogOut className="size-4" />}
      {loading ? "Saindo..." : "Sair"}
    </Button>
  );
}
