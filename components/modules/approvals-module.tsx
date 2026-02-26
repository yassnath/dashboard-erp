"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "@/lib/toast";

import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";

async function fetchApprovals() {
  const response = await fetch("/api/approvals");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat approvals");
  return payload.data as Array<{
    id: string;
    entityType: string;
    entityId: string;
    status: string;
    requestedAt: string;
    requestedBy: { name: string };
    purchaseRequest: { number: string; note: string | null } | null;
  }>;
}

export function ApprovalsModule() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: approvals = [] } = useQuery({ queryKey: ["approvals"], queryFn: fetchApprovals });

  const decideMutation = useMutation({
    mutationFn: async (payload: { approvalId: string; decision: "APPROVED" | "REJECTED"; note?: string }) => {
      const response = await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memproses approval");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success("Approval berhasil diproses.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  return (
    <div>
      <PageHeader
        title="Approvals Inbox"
        description="Approve/reject purchase request dan expense approval secara cepat, termasuk dari mobile."
      />

      {approvals.length === 0 ? (
        <EmptyState title="Inbox approval kosong" description="Semua approval sudah diproses." />
      ) : (
        <div className="grid gap-3">
          {approvals.map((approval) => (
            <Card key={approval.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{approval.entityType.replace("_", " ")}</p>
                  <p className="font-semibold">{approval.purchaseRequest?.number ?? approval.entityId}</p>
                  <p className="text-xs text-muted-foreground">Requester: {approval.requestedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(approval.requestedAt)}</p>
                </div>
                <StatusBadge status={approval.status} />
              </div>

              {approval.purchaseRequest?.note ? (
                <div className="rounded-2xl border border-border/70 bg-background/45 p-2 text-sm text-muted-foreground">
                  {approval.purchaseRequest.note}
                </div>
              ) : null}

              <Input
                placeholder="Catatan approval (opsional)"
                value={notes[approval.id] ?? ""}
                onChange={(event) =>
                  setNotes((prev) => ({
                    ...prev,
                    [approval.id]: event.target.value,
                  }))
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const proceed = await confirm({
                      title: "Reject Approval",
                      description: "Yakin reject approval ini?",
                      confirmText: "Reject",
                      cancelText: "Batal",
                      intent: "danger",
                    });
                    if (!proceed) return;
                    decideMutation.mutate({
                      approvalId: approval.id,
                      decision: "REJECTED",
                      note: notes[approval.id],
                    });
                  }}
                  disabled={decideMutation.isPending}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button
                  onClick={async () => {
                    const proceed = await confirm({
                      title: "Approve Approval",
                      description: "Yakin approve approval ini?",
                      confirmText: "Approve",
                      cancelText: "Batal",
                    });
                    if (!proceed) return;
                    decideMutation.mutate({
                      approvalId: approval.id,
                      decision: "APPROVED",
                      note: notes[approval.id],
                    });
                  }}
                  disabled={decideMutation.isPending}
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

