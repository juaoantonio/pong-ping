import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-border bg-background text-foreground",
        className,
      )}
      {...props}
    />
  );
}
