import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="grid w-full max-w-md gap-5">
        <div className="flex size-10 items-center justify-center rounded-md bg-destructive/15 text-destructive-foreground">
          <ShieldAlert className="size-5" />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Area restrita
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Acesso negado
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Seu usuario nao tem permissao para acessar esta area.
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <Link className={cn(buttonVariants())} href="/tables">
            Voltar as mesas
          </Link>
        </div>
      </section>
    </main>
  );
}
