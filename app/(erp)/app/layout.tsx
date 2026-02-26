import { AppShell } from "@/components/layout/app-shell";
import { requireSessionUser } from "@/lib/session";

export default async function ErpAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  return (
    <AppShell
      user={{
        name: user.name ?? "User",
        email: user.email ?? "",
        role: user.role,
      }}
    >
      {children}
    </AppShell>
  );
}
