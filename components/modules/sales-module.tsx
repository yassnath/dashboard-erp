"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, FileCheck2, FileDown, PlusCircle, ReceiptText, Wallet } from "lucide-react";
import { toast } from "@/lib/toast";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { toNumber } from "@/lib/utils";

async function getCustomers() {
  const response = await fetch("/api/sales/customers");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat customer");
  return payload.data as Array<{ id: string; name: string; email: string | null; phone: string | null; address: string | null }>;
}

async function getInvoices() {
  const response = await fetch("/api/sales/invoices");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat invoice");
  return payload.data as Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    total: string | number;
    customer: { name: string };
    paidAmount: number;
  }>;
}

async function getPayments() {
  const response = await fetch("/api/sales/payments");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat payment");
  return payload.data as Array<{
    id: string;
    amount: string | number;
    method: string;
    paidAt: string;
    invoice: { invoiceNumber: string };
    reference: string | null;
  }>;
}

async function getProducts() {
  const response = await fetch("/api/inventory/products");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat produk");
  return payload.data.products as Array<{ id: string; name: string; sku: string; price: string | number }>;
}

export function SalesModule() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [openCustomer, setOpenCustomer] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: getInvoices });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: getPayments });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const createCustomer = useMutation({
    mutationFn: async (payload: { name: string; email?: string; phone?: string; address?: string }) => {
      const response = await fetch("/api/sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambah customer");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpenCustomer(false);
      toast.success("Customer berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createInvoice = useMutation({
    mutationFn: async (payload: {
      customerId: string;
      productId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      dueDate?: string;
    }) => {
      const response = await fetch("/api/sales/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: payload.customerId,
          dueDate: payload.dueDate,
          taxPercent: 11,
          items: [
            {
              productId: payload.productId,
              description: payload.description,
              quantity: payload.quantity,
              unitPrice: payload.unitPrice,
            },
          ],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat invoice");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpenInvoice(false);
      toast.success("Invoice draft berhasil dibuat.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const issueInvoice = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/sales/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "ISSUE" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal issue invoice");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice berhasil di-issue.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createPayment = useMutation({
    mutationFn: async (payload: { invoiceId: string; amount: number; method: string; reference?: string }) => {
      const response = await fetch("/api/sales/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat pembayaran");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpenPayment(false);
      setSelectedInvoiceId("");
      toast.success("Pembayaran berhasil dicatat.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const customerColumns = useMemo<ColumnDef<(typeof customers)[number]>[]>(
    () => [
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || "-" },
      { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || "-" },
      { accessorKey: "address", header: "Alamat", cell: ({ row }) => row.original.address || "-" },
    ],
    [customers],
  );

  const invoiceColumns = useMemo<ColumnDef<(typeof invoices)[number]>[]>(
    () => [
      { accessorKey: "invoiceNumber", header: "Invoice" },
      { accessorKey: "customer", header: "Customer", cell: ({ row }) => row.original.customer.name },
      { accessorKey: "issueDate", header: "Tanggal", cell: ({ row }) => formatDate(row.original.issueDate) },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        id: "paid",
        header: "Paid",
        cell: ({ row }) => formatCurrency(row.original.paidAmount ?? 0),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.status === "DRAFT" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const proceed = await confirm({
                    title: "Issue Invoice",
                    description: "Issue invoice ini sekarang?",
                    confirmText: "Issue",
                    cancelText: "Batal",
                  });
                  if (!proceed) return;
                  issueInvoice.mutate(row.original.id);
                }}
              >
                Issue
              </Button>
            ) : null}
            {row.original.status === "ISSUED" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedInvoiceId(row.original.id);
                  setOpenPayment(true);
                }}
              >
                Bayar
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/invoice/${row.original.id}/print`} target="_blank">
                <FileDown className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [confirm, invoices, issueInvoice],
  );

  const paymentColumns = useMemo<ColumnDef<(typeof payments)[number]>[]>(
    () => [
      { accessorKey: "invoice", header: "Invoice", cell: ({ row }) => row.original.invoice.invoiceNumber },
      { accessorKey: "method", header: "Metode" },
      { accessorKey: "reference", header: "Referensi", cell: ({ row }) => row.original.reference || "-" },
      { accessorKey: "amount", header: "Jumlah", cell: ({ row }) => formatCurrency(row.original.amount) },
      { accessorKey: "paidAt", header: "Tanggal", cell: ({ row }) => formatDate(row.original.paidAt) },
    ],
    [payments],
  );

  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId);

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Customer, invoice, payment, dan lifecycle invoicing dari draft sampai paid."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/api/export/invoices">
                <Download className="h-4 w-4" /> Export Invoices CSV
              </a>
            </Button>
            <Dialog open={openCustomer} onOpenChange={setOpenCustomer}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4" /> Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Customer</DialogTitle>
                  <DialogDescription>Tambah customer baru untuk transaksi sales.</DialogDescription>
                </DialogHeader>
                <form
                  id="create-customer-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createCustomer.mutate({
                      name: String(formData.get("name") ?? ""),
                      email: String(formData.get("email") ?? ""),
                      phone: String(formData.get("phone") ?? ""),
                      address: String(formData.get("address") ?? ""),
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-name">Nama</Label>
                    <Input id="customer-name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input id="customer-email" type="email" name="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input id="customer-phone" name="phone" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-address">Alamat</Label>
                    <Input id="customer-address" name="address" />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="create-customer-form" disabled={createCustomer.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
              <DialogTrigger asChild>
                <Button>
                  <ReceiptText className="h-4 w-4" /> Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Invoice Draft</DialogTitle>
                  <DialogDescription>Invoice dibuat sebagai draft kemudian di-issue.</DialogDescription>
                </DialogHeader>
                <form
                  id="create-invoice-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const product = products.find((item) => item.id === String(formData.get("productId") ?? ""));
                    createInvoice.mutate({
                      customerId: String(formData.get("customerId") ?? ""),
                      productId: String(formData.get("productId") ?? ""),
                      description: String(formData.get("description") ?? product?.name ?? ""),
                      quantity: toNumber(String(formData.get("quantity") ?? "1")),
                      unitPrice: toNumber(String(formData.get("unitPrice") ?? product?.price ?? "0")),
                      dueDate: String(formData.get("dueDate") ?? "") || undefined,
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label>Customer</Label>
                    <Select name="customerId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Product</Label>
                    <Select name="productId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.sku} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="invoice-qty">Qty</Label>
                      <Input id="invoice-qty" name="quantity" type="number" defaultValue={1} min={1} step="1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="invoice-price">Harga Satuan</Label>
                      <Input id="invoice-price" name="unitPrice" type="number" defaultValue={0} min={0} step="1000" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice-description">Deskripsi</Label>
                    <Input id="invoice-description" name="description" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice-due">Due Date</Label>
                    <Input id="invoice-due" name="dueDate" type="date" />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="create-invoice-form" disabled={createInvoice.isPending}>
                    Simpan Draft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            {invoices.length === 0 ? (
              <EmptyState title="Belum ada invoice" description="Buat invoice draft pertama untuk memulai proses billing." />
            ) : (
              <DataTable columns={invoiceColumns} data={invoices} searchColumn="invoiceNumber" searchPlaceholder="Cari invoice..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            {customers.length === 0 ? (
              <EmptyState title="Belum ada customer" description="Tambahkan customer untuk proses pembuatan invoice." />
            ) : (
              <DataTable columns={customerColumns} data={customers} searchColumn="name" searchPlaceholder="Cari customer..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            {payments.length === 0 ? (
              <EmptyState title="Belum ada pembayaran" description="Pembayaran tercatat setelah invoice status issued." />
            ) : (
              <DataTable columns={paymentColumns} data={payments} searchColumn="method" searchPlaceholder="Cari metode pembayaran..." />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openPayment} onOpenChange={setOpenPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Masukkan pembayaran untuk invoice issued.</DialogDescription>
          </DialogHeader>
          <form
            id="create-payment-form"
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createPayment.mutate({
                invoiceId: selectedInvoiceId,
                method: String(formData.get("method") ?? ""),
                reference: String(formData.get("reference") ?? ""),
                amount: toNumber(String(formData.get("amount") ?? "0")),
              });
            }}
          >
            <div className="rounded-2xl border border-border/70 bg-background/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Invoice</span>
                <Badge variant="secondary">{selectedInvoice?.invoiceNumber ?? "-"}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Sisa Tagihan</span>
                <strong>
                  {formatCurrency(
                    Math.max(0, toNumber(selectedInvoice?.total ?? 0) - toNumber(selectedInvoice?.paidAmount ?? 0)),
                  )}
                </strong>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-method">Metode</Label>
              <Input id="payment-method" name="method" defaultValue="Bank Transfer" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-reference">Referensi</Label>
              <Input id="payment-reference" name="reference" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Jumlah</Label>
              <Input
                id="payment-amount"
                name="amount"
                type="number"
                min={1}
                defaultValue={Math.max(0, toNumber(selectedInvoice?.total ?? 0) - toNumber(selectedInvoice?.paidAmount ?? 0))}
                required
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="create-payment-form" disabled={createPayment.isPending}>
              <Wallet className="h-4 w-4" /> Simpan Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/35 p-3 text-xs text-muted-foreground">
        Workflow invoice: <FileCheck2 className="mx-1 inline h-3.5 w-3.5" /> Draft → Issued → Paid.
      </div>
    </div>
  );
}

