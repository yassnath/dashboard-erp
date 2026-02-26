import { type DefaultSession, getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 10,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            email: parsed.data.email,
            isActive: true,
          },
          include: {
            branch: true,
          },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await compare(parsed.data.password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          branchId: user.branchId,
          branchCode: user.branch?.code ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.orgId = user.orgId;
        token.branchId = user.branchId;
        token.branchCode = user.branchCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = token.role as SessionUser["role"];
        session.user.orgId = String(token.orgId ?? "");
        session.user.branchId = (token.branchId as string | null | undefined) ?? null;
        session.user.branchCode = (token.branchCode as string | null | undefined) ?? null;
      }
      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export type SessionUser = DefaultSession["user"] & {
  id: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
  orgId: string;
  branchId: string | null;
  branchCode: string | null;
};
