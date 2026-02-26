"use client";

import { useEffect } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { ContrastToggle } from "@/components/layout/contrast-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { type AppRole } from "@/lib/navigation";
import { useUiStore } from "@/stores/ui-store";

type TopBarProps = {
  user: {
    name: string;
    email: string;
    role: AppRole;
  };
};

export function TopBar({ user }: TopBarProps) {
  const highContrast = useUiStore((state) => state.highContrast);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = highContrast ? "high" : "default";
  }, [highContrast]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MobileSidebar role={user.role} />
          <CommandPalette role={user.role} />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ContrastToggle />
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </div>
      </div>
    </header>
  );
}
