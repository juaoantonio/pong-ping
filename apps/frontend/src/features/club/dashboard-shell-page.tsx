import { Activity, LockKeyhole, Trophy } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";

export function DashboardShellPage() {
  return (
    <PageShell
      description="Área autenticada para a rotina do clube."
      eyebrow="Clube"
      title="Dashboard"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardPanel icon={Trophy} label="Workspace" value="Clube conectado" />
        <DashboardPanel icon={LockKeyhole} label="Sessao" value="Acesso validado" />
        <DashboardPanel icon={Activity} label="Status" value="Operacional" />
      </div>
    </PageShell>
  );
}

function DashboardPanel({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <section className="grid min-h-32 content-between gap-4 rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-xl font-semibold tracking-normal text-pretty">{value}</p>
    </section>
  );
}
