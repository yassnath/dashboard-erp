"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

async function fetchAuditLogs() {
  const response = await fetch("/api/audit-logs?limit=120");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat audit logs");
  return payload.data as Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    details: Record<string, unknown> | null;
    createdAt: string;
    user: { name: string | null; email: string | null } | null;
    branch: { code: string } | null;
  }>;
}

export function AuditLogsModule() {
  const { data: logs = [] } = useQuery({ queryKey: ["audit-logs"], queryFn: fetchAuditLogs });

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Pelacakan perubahan kritikal: create/update/delete, approvals, status changes, postings."
      />
      <Card>
        {logs.length === 0 ? (
          <EmptyState title="Audit log kosong" description="Belum ada aktivitas tercatat." />
        ) : (
          <DataTable
            columns={[
              { accessorKey: "createdAt", header: "Timestamp", cell: ({ row }) => formatDateTime(row.original.createdAt) },
              { accessorKey: "action", header: "Action", cell: ({ row }) => <StatusBadge status={row.original.action} /> },
              { accessorKey: "entity", header: "Entity" },
              { accessorKey: "entityId", header: "Entity ID" },
              { accessorKey: "user", header: "User", cell: ({ row }) => row.original.user?.name || "System" },
              { accessorKey: "branch", header: "Branch", cell: ({ row }) => row.original.branch?.code || "-" },
              {
                accessorKey: "details",
                header: "Details",
                cell: ({ row }) =>
                  row.original.details ? JSON.stringify(row.original.details).slice(0, 80) : "-",
              },
            ]}
            data={logs}
            searchColumn="entity"
            searchPlaceholder="Cari entity..."
          />
        )}
      </Card>
    </div>
  );
}

