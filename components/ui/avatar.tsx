import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
};

export function Avatar({ src, name, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className={cn("relative flex size-11 shrink-0 overflow-hidden rounded-full bg-accent", className)}>
      {src ? (
        <Image alt={name} className="object-cover" fill sizes="44px" src={src} />
      ) : (
        <span className="m-auto text-sm font-semibold text-accent-foreground">{initial}</span>
      )}
    </div>
  );
}
