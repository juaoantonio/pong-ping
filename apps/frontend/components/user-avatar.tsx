import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type UserAvatarProps = {
  className?: string;
  name: string;
  src?: string | null;
  size?: "default" | "sm" | "lg";
};

export function UserAvatar({ className, name, size, src }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <Avatar className={className} size={size}>
      {src ? <AvatarImage alt={name} src={src} /> : null}
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );
}
