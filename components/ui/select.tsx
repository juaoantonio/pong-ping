import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
