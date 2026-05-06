import "next-auth";
import type { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      tenantId: string | null;
      tenantSlug: string | null;
      tenantName: string | null;
    };
  }

  interface User {
    role?: Role;
    tenantId?: string | null;
  }
}
