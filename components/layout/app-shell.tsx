"use client";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { type AppRole } from "@/lib/navigation";

type AppShellProps = {
  user: {
    name: string;
    email: string;
    role: AppRole;
  };
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar role={user.role} />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 md:px-6 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav role={user.role} />
    </div>
  );
}
