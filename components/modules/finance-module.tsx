"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, PlusCircle } from "lucide-react";
import { toast } from "@/lib/toast";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { KpiCard } from "@/components/modules/kpi-card";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { toNumber } from "@/lib/utils";

async function fetchExpenses() {
  const response = await fetch("/api/finance/expenses");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat expense");
  return payload.data as Array<{
    id: string;
    vendor: string;
    category: string;
    amount: string | number;
    status: string;
    date: string;
  }>;
}

async function fetchJournalEntries() {
  const response = await fetch("/api/finance/journal-entries");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat jurnal");
  return payload.data as Array<{
    id: string;
    entryNumber: string;
    description: string;
    date: string;
    postedAt: string | null;
    lines: Array<{ accountName: string; debit: string | number; credit: string | number }>;
  }>;
}

async function fetchOverview() {
  const response = await fetch("/api/overview?range=30d");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat overview");
  return payload.data;
}

export function FinanceModule() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [openExpense, setOpenExpense] = useState(false);
  const [openJournal, setOpenJournal] = useState(false);

  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: fetchExpenses });
  const { data: journals = [] } = useQuery({ queryKey: ["journal-entries"], queryFn: fetchJournalEntries });
  const { data: overview } = useQuery({ queryKey: ["overview", "finance"], queryFn: fetchOverview });

  const createExpense = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambah expense");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setOpenExpense(false);
      toast.success("Expense berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const markExpensePaid = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/finance/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "MARK_PAID" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal update expense");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense berhasil ditandai paid.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createJournal = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/finance/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat journal");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setOpenJournal(false);
      toast.success("Journal draft berhasil dibuat.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const postJournal = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/finance/journal-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "POST" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal posting journal");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Journal berhasil diposting.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const expenseColumns = useMemo<ColumnDef<(typeof expenses)[number]>[]>(
    () => [
      { accessorKey: "vendor", header: "Vendor" },
      { accessorKey: "category", header: "Kategori" },
      { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
      { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) =>
          row.original.status === "APPROVED" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const proceed = await confirm({
                  title: "Mark Expense Paid",
                  description: "Tandai expense ini sebagai PAID?",
                  confirmText: "Mark Paid",
                  cancelText: "Batal",
                });
                if (!proceed) return;
                markExpensePaid.mutate(row.original.id);
              }}
            >
              Mark Paid
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    [confirm, expenses, markExpensePaid],
  );

  const journalColumns = useMemo<ColumnDef<(typeof journals)[number]>[]>(
    () => [
      { accessorKey: "entryNumber", header: "Entry" },
      { accessorKey: "description", header: "Deskripsi" },
      { accessorKey: "date", header: "Tanggal", cell: ({ row }) => formatDate(row.original.date) },
      {
        id: "debit",
        header: "Total Debit",
        cell: ({ row }) =>
          formatCurrency(
            row.original.lines.reduce((acc, line) => acc + toNumber(line.debit), 0),
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.postedAt ? "POSTED" : "DRAFT"} />,
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) =>
          row.original.postedAt ? (
            "-"
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const proceed = await confirm({
                  title: "Post Journal",
                  description: "Post journal ini sekarang?",
                  confirmText: "Post",
                  cancelText: "Batal",
                });
                if (!proceed) return;
                postJournal.mutate(row.original.id);
              }}
            >
              Post
            </Button>
          ),
      },
    ],
    [confirm, journals, postJournal],
  );

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Expense tracking, journal entries, dan P&L summary dari modul sales + expense."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/api/export/expenses">
                <Download className="h-4 w-4" /> Export Expenses CSV
              </a>
            </Button>
            <Dialog open={openExpense} onOpenChange={setOpenExpense}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4" /> Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Expense</DialogTitle>
                </DialogHeader>
                <form
                  id="expense-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createExpense.mutate({
                      vendor: String(formData.get("vendor") ?? ""),
                      category: String(formData.get("category") ?? ""),
                      amount: toNumber(String(formData.get("amount") ?? "0")),
                      date: String(formData.get("date") ?? ""),
                      note: String(formData.get("note") ?? "") || undefined,
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-vendor">Vendor</Label>
                    <Input id="expense-vendor" name="vendor" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-category">Kategori</Label>
                    <Input id="expense-category" name="category" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-amount">Amount</Label>
                    <Input id="expense-amount" name="amount" type="number" min={1} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-date">Date</Label>
                    <Input id="expense-date" name="date" type="date" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expense-note">Note</Label>
                    <Input id="expense-note" name="note" />
                  </div>
                </form>
                <DialogFooter>
                  <Button form="expense-form" type="submit" disabled={createExpense.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openJournal} onOpenChange={setOpenJournal}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4" /> Journal Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Journal Entry</DialogTitle>
                  <DialogDescription>Input 2 baris debit dan credit yang seimbang.</DialogDescription>
                </DialogHeader>
                <form
                  id="journal-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const amount = toNumber(String(formData.get("amount") ?? "0"));
                    createJournal.mutate({
                      description: String(formData.get("description") ?? ""),
                      date: String(formData.get("date") ?? ""),
                      lines: [
                        {
                          accountName: String(formData.get("debitAccount") ?? ""),
                          debit: amount,
                          credit: 0,
                        },
                        {
                          accountName: String(formData.get("creditAccount") ?? ""),
                          debit: 0,
                          credit: amount,
                        },
                      ],
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="journal-description">Deskripsi</Label>
                    <Input id="journal-description" name="description" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="journal-date">Date</Label>
                    <Input id="journal-date" name="date" type="date" required />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="debit-account">Debit Account</Label>
                      <Input id="debit-account" name="debitAccount" defaultValue="Expense" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="credit-account">Credit Account</Label>
                      <Input id="credit-account" name="creditAccount" defaultValue="Cash" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="journal-amount">Amount</Label>
                    <Input id="journal-amount" name="amount" type="number" min={1} required />
                  </div>
                </form>
                <DialogFooter>
                  <Button form="journal-form" type="submit" disabled={createJournal.isPending}>
                    Simpan Draft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <KpiCard label="Revenue (30d)" value={formatCurrency(overview?.kpis?.revenue ?? 0)} tone="positive" variant="cyan" />
        <KpiCard label="Expenses (30d)" value={formatCurrency(overview?.kpis?.expenses ?? 0)} tone="negative" variant="orange" />
        <KpiCard
          label="P&L (30d)"
          value={formatCurrency(overview?.kpis?.netProfit ?? 0)}
          tone={(overview?.kpis?.netProfit ?? 0) >= 0 ? "positive" : "negative"}
          variant="green"
        />
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            {expenses.length === 0 ? (
              <EmptyState title="Belum ada expense" description="Tambahkan expense untuk pencatatan operasional." />
            ) : (
              <DataTable columns={expenseColumns} data={expenses} searchColumn="vendor" searchPlaceholder="Cari vendor..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="journals">
          <Card>
            {journals.length === 0 ? (
              <EmptyState title="Belum ada journal" description="Buat journal entry untuk posting akuntansi dasar." />
            ) : (
              <DataTable columns={journalColumns} data={journals} searchColumn="entryNumber" searchPlaceholder="Cari entry..." />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

