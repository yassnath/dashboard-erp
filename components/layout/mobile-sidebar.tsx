"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { type AppRole, getSidebarItemsByRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileSidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const sidebarItems = getSidebarItemsByRole(role);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="md:hidden">
        <SheetHeader>
          <Link href="/app" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Solvix ERP" width={34} height={34} className="rounded-xl" />
            <span className="text-sm font-semibold tracking-wide">SOLVIX ERP</span>
          </Link>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center rounded-2xl border px-3",
                  active
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--accent)]"
                    : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-panel",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="ml-3 text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
