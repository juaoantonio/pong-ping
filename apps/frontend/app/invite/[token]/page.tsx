import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Autorizar acesso</CardTitle>
          <CardDescription>Use este convite para liberar um email para login.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <InviteForm token={token} />
          <Link className={buttonVariants({ variant: "ghost" })} href="/login">
            Ir para login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
