import {
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileClock,
  FileSearch,
  Home,
  PackageSearch,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

export type AppRole = "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "STAFF" | "VIEWER";

type RoleScopedItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
};

type RoleScopedCommandItem = {
  label: string;
  href: string;
  keywords: string;
  roles?: AppRole[];
};

const ADMIN_ROLES: AppRole[] = ["SUPER_ADMIN", "ORG_ADMIN"];
const MANAGER_ROLES: AppRole[] = ["SUPER_ADMIN", "ORG_ADMIN", "MANAGER"];

const sidebarItems: RoleScopedItem[] = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/sales", label: "Sales", icon: DollarSign },
  { href: "/app/inventory", label: "Inventory", icon: Boxes },
  { href: "/app/procurement", label: "Procurement", icon: ShoppingCart },
  { href: "/app/finance", label: "Finance", icon: FileSearch, roles: MANAGER_ROLES },
  { href: "/app/hr", label: "HR", icon: Users, roles: MANAGER_ROLES },
  { href: "/app/projects", label: "Projects", icon: Briefcase },
  { href: "/app/approvals", label: "Approvals", icon: ClipboardCheck, roles: MANAGER_ROLES },
  { href: "/app/audit-logs", label: "Audit Logs", icon: FileClock, roles: ADMIN_ROLES },
  { href: "/app/settings", label: "Settings", icon: Settings, roles: ADMIN_ROLES },
];

const mobileNavItems: RoleScopedItem[] = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/approvals", label: "Approvals", icon: ClipboardList, roles: MANAGER_ROLES },
  { href: "/app/sales", label: "Sales", icon: DollarSign },
  { href: "/app/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/app/settings", label: "More", icon: Building2, roles: ADMIN_ROLES },
];

const commandItems: RoleScopedCommandItem[] = [
  { label: "Open Overview", href: "/app", keywords: "dashboard home" },
  { label: "Open Approval Inbox", href: "/app/approvals", keywords: "approval pr expense", roles: MANAGER_ROLES },
  { label: "Create Customer", href: "/app/sales?create=customer", keywords: "sales customer" },
  { label: "Create Invoice", href: "/app/sales?create=invoice", keywords: "sales invoice" },
  { label: "Create Purchase Request", href: "/app/procurement?create=pr", keywords: "procurement purchase request" },
  { label: "Create Expense", href: "/app/finance?create=expense", keywords: "finance expense", roles: MANAGER_ROLES },
  { label: "Open Products", href: "/app/inventory", keywords: "inventory products stock" },
  { label: "Open Audit Logs", href: "/app/audit-logs", keywords: "audit logs", roles: ADMIN_ROLES },
];

function isAllowedForRole<T extends { roles?: AppRole[] }>(item: T, role: AppRole) {
  if (!item.roles) return true;
  return item.roles.includes(role);
}

export function getSidebarItemsByRole(role: AppRole) {
  return sidebarItems.filter((item) => isAllowedForRole(item, role));
}

export function getMobileNavItemsByRole(role: AppRole) {
  return mobileNavItems.filter((item) => isAllowedForRole(item, role));
}

export function getCommandItemsByRole(role: AppRole) {
  return commandItems.filter((item) => isAllowedForRole(item, role));
}
