import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth, type SessionUser } from "@/lib/auth";
import { hasAnyRole } from "@/lib/permissions";

export async function getSessionUser() {
  const session = await auth();
  return session?.user as SessionUser | null;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireSessionUser();

  if (!hasAnyRole(user.role, roles)) {
    redirect("/app");
  }

  return user;
}

export function scopedWhere(user: SessionUser, includeBranch = false) {
  if (includeBranch && user.branchId) {
    return {
      orgId: user.orgId,
      branchId: user.branchId,
    };
  }

  return {
    orgId: user.orgId,
  };
}

export function assertOrgScope(orgId: string, user: SessionUser) {
  if (user.role !== "SUPER_ADMIN" && orgId !== user.orgId) {
    throw new Error("Forbidden");
  }
}
