"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, PlusCircle, Send } from "lucide-react";
import { toast } from "@/lib/toast";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { toNumber } from "@/lib/utils";

async function fetchSuppliers() {
  const response = await fetch("/api/procurement/suppliers");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat suppliers");
  return payload.data as Array<{ id: string; name: string; email: string | null; phone: string | null; address: string | null }>;
}

async function fetchPrs() {
  const response = await fetch("/api/procurement/purchase-requests");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat PR");
  return payload.data as Array<{
    id: string;
    number: string;
    status: string;
    note: string | null;
    supplier: { name: string } | null;
    createdBy: { name: string };
    createdAt: string;
    items: Array<{ id: string; product: { name: string }; quantity: string | number; lineTotal: string | number }>;
  }>;
}

async function fetchPos() {
  const response = await fetch("/api/procurement/purchase-orders");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat PO");
  return payload.data as Array<{
    id: string;
    number: string;
    status: string;
    total: string | number;
    issuedAt: string | null;
    receivedAt: string | null;
    purchaseRequest: { number: string } | null;
    supplier: { name: string } | null;
  }>;
}

async function fetchProducts() {
  const response = await fetch("/api/inventory/products");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat produk");
  return payload.data.products as Array<{ id: string; sku: string; name: string; cost: string | number }>;
}

export function ProcurementModule() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [openSupplier, setOpenSupplier] = useState(false);
  const [openPr, setOpenPr] = useState(false);

  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const { data: purchaseRequests = [] } = useQuery({ queryKey: ["purchase-requests"], queryFn: fetchPrs });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["purchase-orders"], queryFn: fetchPos });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const createSupplier = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/procurement/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambah supplier");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setOpenSupplier(false);
      toast.success("Supplier berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createPr = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/procurement/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat PR");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setOpenPr(false);
      toast.success("Purchase request draft berhasil dibuat.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const submitPr = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/procurement/purchase-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "SUBMIT" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal submit PR");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success("Purchase request berhasil disubmit.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createPo = useMutation({
    mutationFn: async (purchaseRequestId: string) => {
      const response = await fetch("/api/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseRequestId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat PO");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      toast.success("Purchase order berhasil dibuat.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const receivePo = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/procurement/purchase-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "RECEIVE" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal receive PO");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock receiving berhasil diposting.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const supplierColumns = useMemo<ColumnDef<(typeof suppliers)[number]>[]>(
    () => [
      { accessorKey: "name", header: "Supplier" },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || "-" },
      { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || "-" },
      { accessorKey: "address", header: "Address", cell: ({ row }) => row.original.address || "-" },
    ],
    [suppliers],
  );

  const prColumns = useMemo<ColumnDef<(typeof purchaseRequests)[number]>[]>(
    () => [
      { accessorKey: "number", header: "PR Number" },
      { accessorKey: "supplier", header: "Supplier", cell: ({ row }) => row.original.supplier?.name || "-" },
      { accessorKey: "createdBy", header: "Requester", cell: ({ row }) => row.original.createdBy.name },
      { accessorKey: "createdAt", header: "Date", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) =>
          formatCurrency(
            row.original.items.reduce((acc, item) => acc + toNumber(item.lineTotal), 0),
          ),
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.status === "DRAFT" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const proceed = await confirm({
                    title: "Submit Purchase Request",
                    description: "Submit PR ini ke approval inbox?",
                    confirmText: "Submit",
                    cancelText: "Batal",
                  });
                  if (!proceed) return;
                  submitPr.mutate(row.original.id);
                }}
              >
                <Send className="h-3.5 w-3.5" /> Submit
              </Button>
            ) : null}
            {row.original.status === "APPROVED" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const proceed = await confirm({
                    title: "Buat Purchase Order",
                    description: "Buat PO dari PR ini?",
                    confirmText: "Buat PO",
                    cancelText: "Batal",
                  });
                  if (!proceed) return;
                  createPo.mutate(row.original.id);
                }}
              >
                Buat PO
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [confirm, purchaseRequests, submitPr, createPo],
  );

  const poColumns = useMemo<ColumnDef<(typeof purchaseOrders)[number]>[]>(
    () => [
      { accessorKey: "number", header: "PO Number" },
      { accessorKey: "purchaseRequest", header: "Source PR", cell: ({ row }) => row.original.purchaseRequest?.number || "-" },
      { accessorKey: "supplier", header: "Supplier", cell: ({ row }) => row.original.supplier?.name || "-" },
      { accessorKey: "total", header: "Total", cell: ({ row }) => formatCurrency(row.original.total) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.status === "ISSUED" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const proceed = await confirm({
                  title: "Receive Stock",
                  description: "Konfirmasi barang sudah diterima dan stok ditambah?",
                  confirmText: "Konfirmasi",
                  cancelText: "Batal",
                });
                if (!proceed) return;
                receivePo.mutate(row.original.id);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Receive Stock
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
    ],
    [confirm, purchaseOrders, receivePo],
  );

  return (
    <div>
      <PageHeader
        title="Procurement"
        description="Supplier management, purchase request approval flow, dan purchase order receiving."
        actions={
          <>
            <Dialog open={openSupplier} onOpenChange={setOpenSupplier}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4" /> Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Supplier</DialogTitle>
                </DialogHeader>
                <form
                  id="supplier-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createSupplier.mutate({
                      name: String(formData.get("name") ?? ""),
                      email: String(formData.get("email") ?? ""),
                      phone: String(formData.get("phone") ?? ""),
                      address: String(formData.get("address") ?? ""),
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-name">Nama</Label>
                    <Input id="supplier-name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-email">Email</Label>
                    <Input id="supplier-email" name="email" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-phone">Phone</Label>
                    <Input id="supplier-phone" name="phone" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-address">Address</Label>
                    <Input id="supplier-address" name="address" />
                  </div>
                </form>
                <DialogFooter>
                  <Button form="supplier-form" type="submit" disabled={createSupplier.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openPr} onOpenChange={setOpenPr}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4" /> Purchase Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Purchase Request</DialogTitle>
                  <DialogDescription>PR dibuat sebagai draft, lalu submit untuk approval.</DialogDescription>
                </DialogHeader>
                <form
                  id="pr-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createPr.mutate({
                      supplierId: String(formData.get("supplierId") ?? "") || undefined,
                      note: String(formData.get("note") ?? "") || undefined,
                      items: [
                        {
                          productId: String(formData.get("productId") ?? ""),
                          quantity: toNumber(String(formData.get("quantity") ?? "0")),
                          unitCost: toNumber(String(formData.get("unitCost") ?? "0")),
                        },
                      ],
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label>Supplier</Label>
                    <Select name="supplierId">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
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
                      <Label htmlFor="pr-qty">Qty</Label>
                      <Input id="pr-qty" name="quantity" type="number" min={1} defaultValue={1} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pr-cost">Unit Cost</Label>
                      <Input id="pr-cost" name="unitCost" type="number" min={0} step="100" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pr-note">Note</Label>
                    <Input id="pr-note" name="note" />
                  </div>
                </form>
                <DialogFooter>
                  <Button form="pr-form" type="submit" disabled={createPr.isPending}>
                    Simpan Draft PR
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="pr">
        <TabsList>
          <TabsTrigger value="pr">Purchase Requests</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="pr">
          <Card>
            {purchaseRequests.length === 0 ? (
              <EmptyState title="Belum ada PR" description="Buat PR pertama untuk memulai alur procurement." />
            ) : (
              <DataTable columns={prColumns} data={purchaseRequests} searchColumn="number" searchPlaceholder="Cari PR..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="po">
          <Card>
            {purchaseOrders.length === 0 ? (
              <EmptyState title="Belum ada PO" description="PO akan dibuat dari PR yang sudah approved." />
            ) : (
              <DataTable columns={poColumns} data={purchaseOrders} searchColumn="number" searchPlaceholder="Cari PO..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            {suppliers.length === 0 ? (
              <EmptyState title="Belum ada supplier" description="Tambahkan supplier untuk proses procurement." />
            ) : (
              <DataTable columns={supplierColumns} data={suppliers} searchColumn="name" searchPlaceholder="Cari supplier..." />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

