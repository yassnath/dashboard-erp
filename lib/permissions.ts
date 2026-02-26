import { Role } from "@prisma/client";

export const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ORG_ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  VIEWER: 1,
};

export function hasMinimumRole(currentRole: Role, minimumRole: Role) {
  return roleHierarchy[currentRole] >= roleHierarchy[minimumRole];
}

export function hasAnyRole(currentRole: Role, roles: Role[]) {
  return roles.includes(currentRole);
}

export const modulePermissions: Record<string, Role[]> = {
  "/app": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.STAFF, Role.VIEWER],
  "/app/analytics": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.STAFF, Role.VIEWER],
  "/app/sales": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.STAFF, Role.VIEWER],
  "/app/inventory": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.STAFF, Role.VIEWER],
  "/app/procurement": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.STAFF, Role.VIEWER],
  "/app/finance": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER],
  "/app/hr": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER],
  "/app/projects": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.STAFF, Role.VIEWER],
  "/app/settings": [Role.SUPER_ADMIN, Role.ORG_ADMIN],
  "/app/approvals": [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER],
  "/app/audit-logs": [Role.SUPER_ADMIN, Role.ORG_ADMIN],
};
