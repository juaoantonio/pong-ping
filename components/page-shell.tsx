import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function PageShell({
  action,
  children,
  className,
  description,
  eyebrow,
  title,
}: PageShellProps) {
  return (
    <section className={cn("mx-auto grid w-full max-w-6xl gap-6", className)}>
      <header className="grid gap-4 border-b border-border/80 pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-pretty sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex sm:justify-end">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

type EmptyStateProps = {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  title: ReactNode;
};

export function EmptyState({
  action,
  children,
  className,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid justify-items-start gap-3 rounded-lg border border-dashed bg-muted/30 px-5 py-8 text-sm",
        className,
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {children ? (
        <div className="max-w-xl leading-6 text-muted-foreground">
          {children}
        </div>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
