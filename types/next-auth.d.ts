import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
      orgId: string;
      branchId: string | null;
      branchCode: string | null;
    };
  }

  interface User {
    id: string;
    role: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
    orgId: string;
    branchId: string | null;
    branchCode: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
    orgId?: string;
    branchId?: string | null;
    branchCode?: string | null;
  }
}
