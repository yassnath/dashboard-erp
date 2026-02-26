"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { type AppRole, getMobileNavItemsByRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const mobileNavItems = getMobileNavItemsByRole(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-panel/90 p-2 backdrop-blur-xl md:hidden">
      <div
        className="mx-auto grid max-w-lg gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(mobileNavItems.length, 1)}, minmax(0, 1fr))` }}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
