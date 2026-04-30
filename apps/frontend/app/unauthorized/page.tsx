import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-destructive/15 text-destructive-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <CardTitle>Acesso negado</CardTitle>
          <CardDescription>
            Seu usuario nao tem permissao para acessar esta area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={cn(buttonVariants())} href="/rooms">
            Voltar as salas
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
