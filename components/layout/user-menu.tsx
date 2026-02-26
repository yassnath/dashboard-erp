"use client";

import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { useConfirm } from "@/components/providers/confirm-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  name: string;
  email: string;
  role: string;
};

export function UserMenu({ name, email, role }: UserMenuProps) {
  const confirm = useConfirm();

  async function handleLogout() {
    const confirmed = await confirm({
      title: "Logout",
      description: "Yakin ingin logout dari Solvix ERP?",
      confirmText: "Logout",
      cancelText: "Batal",
      intent: "danger",
    });
    if (!confirmed) {
      return;
    }

    toast.success("Logout berhasil.");
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-2xl px-3">
          <UserCircle2 className="h-4 w-4" />
          <span className="hidden md:inline">{name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
          <div className="text-xs text-[var(--accent)]">{role.replace("_", " ")}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
