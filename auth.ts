import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import {
  canSignInWithEmail,
  ensureInitialSuperAdminAllowed,
  isInitialSuperAdminEmail,
} from "@/lib/auth/sign-in-policy";
import { normalizeEmail } from "@/lib/auth/access";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
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

      const googleEmailVerified =
          account?.provider !== "google" || profile?.email_verified === true;

      if (!email || !googleEmailVerified || !(await canSignInWithEmail(email))) {
        return "/login?error=email_not_allowed";
      }

      return true;
    },

    async session({ session, user }) {
      session.user.id = user.id;

      const dbUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          email: true,
          role: true,
        },
      });

      if (
          dbUser?.email &&
          isInitialSuperAdminEmail(dbUser.email) &&
          dbUser.role !== "superadmin"
      ) {
        await ensureInitialSuperAdminAllowed(dbUser.email, user.id);

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            role: "superadmin",
          },
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
          where: {
            id: user.id,
          },
          data: {
            role: "superadmin",
          },
        });
      }
    },
  },
});