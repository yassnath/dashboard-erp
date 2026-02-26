"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type AppRole, getSidebarItemsByRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

export function Sidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const sidebarItems = getSidebarItemsByRole(role);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/70 bg-panel/60 p-4 backdrop-blur-xl md:flex",
        collapsed ? "w-[88px]" : "w-[270px]",
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Solvix ERP" width={36} height={36} className="rounded-xl" />
          {!collapsed ? <span className="text-sm font-semibold tracking-wide">SOLVIX ERP</span> : null}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const iconTone = [
            "text-[var(--chart-1)]",
            "text-[var(--chart-2)]",
            "text-[var(--chart-3)]",
            "text-[var(--chart-4)]",
            "text-[var(--chart-5)]",
            "text-[var(--chart-6)]",
            "text-[var(--chart-7)]",
            "text-[var(--chart-8)]",
          ][index % 8];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-11 items-center rounded-2xl border px-3 transition-all",
                active
                  ? "border-[var(--accent)]/30 bg-[var(--accent)]/12 text-[var(--accent)]"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-panel hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-[var(--accent)]" : iconTone)} />
              {!collapsed ? <span className="ml-3 text-sm font-medium">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
