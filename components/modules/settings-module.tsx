"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { toast } from "@/lib/toast";

import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUiStore } from "@/stores/ui-store";

async function fetchBranches() {
  const response = await fetch("/api/settings/branches");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat branch");
  return payload.data as Array<{ id: string; name: string; code: string; address: string | null; isActive: boolean }>;
}

export function SettingsModule() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });

  const [openBranch, setOpenBranch] = useState(false);

  const highContrast = useUiStore((state) => state.highContrast);
  const toggleHighContrast = useUiStore((state) => state.toggleHighContrast);

  const createBranch = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/settings/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambah branch");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setOpenBranch(false);
      toast.success("Branch berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  return (
    <div>
      <PageHeader title="Settings" description="Konfigurasi org, branch, role, dan preferensi tampilan dashboard." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Organization</h3>
          <div className="rounded-2xl border border-border/70 bg-background/45 p-3 text-sm">
            <p>
              User: <strong>{session?.user?.name}</strong>
            </p>
            <p>
              Email: <strong>{session?.user?.email}</strong>
            </p>
            <p>
              Role: <strong>{session?.user?.role}</strong>
            </p>
            <p>
              Org ID: <strong>{session?.user?.orgId}</strong>
            </p>
            <p>
              Branch ID: <strong>{session?.user?.branchId ?? "(none)"}</strong>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">RBAC aktif: SUPER_ADMIN, ORG_ADMIN, MANAGER, STAFF, VIEWER.</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Preferences</h3>
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/45 px-3 py-2 text-sm">
            <span>High Contrast Mode</span>
            <Switch checked={highContrast} onCheckedChange={toggleHighContrast} />
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 p-3 text-sm text-muted-foreground">
            Preferensi motion mengikuti `prefers-reduced-motion` browser untuk performa dan aksesibilitas.
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <PageHeader
          title="Branches"
          description="Kelola branch operasional dalam organisasi yang sama."
          actions={
            <Dialog open={openBranch} onOpenChange={setOpenBranch}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4" /> Tambah Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Branch</DialogTitle>
                </DialogHeader>
                <form
                  id="branch-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createBranch.mutate({
                      name: String(formData.get("name") ?? ""),
                      code: String(formData.get("code") ?? ""),
                      address: String(formData.get("address") ?? "") || undefined,
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="branch-name">Nama</Label>
                    <Input id="branch-name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="branch-code">Code</Label>
                    <Input id="branch-code" name="code" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="branch-address">Address</Label>
                    <Input id="branch-address" name="address" />
                  </div>
                </form>
                <DialogFooter>
                  <Button form="branch-form" type="submit" disabled={createBranch.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <Card>
          {branches.length === 0 ? (
            <EmptyState title="Belum ada branch" description="Tambahkan branch baru untuk mendukung multi-tenant multi-lokasi." />
          ) : (
            <DataTable
              columns={[
                { accessorKey: "name", header: "Nama" },
                { accessorKey: "code", header: "Code" },
                { accessorKey: "address", header: "Address", cell: ({ row }) => row.original.address || "-" },
                { accessorKey: "isActive", header: "Status", cell: ({ row }) => (row.original.isActive ? "Active" : "Inactive") },
              ]}
              data={branches}
              searchColumn="name"
              searchPlaceholder="Cari branch..."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

