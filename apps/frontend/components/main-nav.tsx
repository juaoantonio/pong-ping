import Link from "next/link";
import { LogOut, Shield, Trophy, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { canAccessAdmin, type Role } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type MainNavProps = {
  role: Role;
};

export function MainNav({ role }: MainNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      <Link
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        href="/rooms"
      >
        Salas
      </Link>
      {canAccessAdmin(role) ? (
        <>
          <Link
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            href="/admin/users"
          >
            <Shield className="size-4" />
            Admin
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            href="/rooms"
          >
            <Trophy className="size-4" />
            Salas
          </Link>
        </>
      ) : null}
      <Link
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        href="/profile"
      >
        <UserRound className="size-4" />
        Perfil
      </Link>
      <LogoutButton icon={<LogOut className="size-4" />} />
    </nav>
  );
}
