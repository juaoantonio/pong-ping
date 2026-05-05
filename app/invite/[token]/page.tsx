import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { InviteForm } from "@/app/invite/[token]/invite-form";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="grid w-full max-w-md gap-6">
        <header className="grid gap-2 border-b border-border/80 pb-5">
          <p className="text-sm font-medium text-muted-foreground">
            Convite de acesso
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Autorizar acesso
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use este convite para liberar um email para login.
          </p>
        </header>

        <section className="grid gap-4 border-t border-border pt-5">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold">Liberar meu email</h2>
            <p className="text-sm text-muted-foreground">
              O email autorizado podera concluir login com Google neste tenant.
            </p>
          </div>
          <InviteForm token={token} />
        </section>

        <div className="border-t border-border pt-4">
          <Link className={buttonVariants({ variant: "ghost" })} href="/login">
            Ir para login
          </Link>
        </div>
      </section>
    </main>
  );
}
