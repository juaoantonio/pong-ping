import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { canSignInWithEmail, ensureInitialSuperAdminAllowed, isInitialSuperAdminEmail } from "@/lib/auth/sign-in-policy";
import { normalizeEmail } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = normalizeEmail(user.email ?? "");
      const googleEmailVerified = account?.provider !== "google" || profile?.email_verified === true;
      const initialSuperAdmin = isInitialSuperAdminEmail(email);

      if (!googleEmailVerified || !(await canSignInWithEmail(email))) {
        return "/login?error=email_not_allowed";
      }

      if (user.id && account?.provider === "google") {
        const nextRole: Role | undefined = initialSuperAdmin ? "superadmin" : undefined;
        const googleId = account.providerAccountId ?? profile?.sub;
        const avatarUrl = typeof profile?.picture === "string" ? profile.picture : user.image;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(googleId ? { googleId } : {}),
            ...(avatarUrl ? { avatarUrl, image: avatarUrl } : {}),
            ...(nextRole ? { role: nextRole } : {}),
          },
        });
      }

      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, role: true },
      });

      if (dbUser?.email && isInitialSuperAdminEmail(dbUser.email) && dbUser.role !== "superadmin") {
        await ensureInitialSuperAdminAllowed(dbUser.email, user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "superadmin" },
        });
        session.user.role = "superadmin";
      } else {
        session.user.role = dbUser?.role ?? "user";
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && user.email && isInitialSuperAdminEmail(user.email)) {
        await ensureInitialSuperAdminAllowed(user.email, user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "superadmin" },
        });
      }
    },
  },
});
