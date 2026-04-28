import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border border-destructive/30 bg-destructive/15 px-4 py-3 text-sm text-destructive-foreground",
        className,
      )}
      role="alert"
      {...props}
    />
  );
}
