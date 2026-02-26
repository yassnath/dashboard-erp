"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, MoveRight, PlusCircle } from "lucide-react";
import { toast } from "@/lib/toast";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
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

async function fetchProducts() {
  const response = await fetch("/api/inventory/products");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat produk");
  return payload.data as {
    products: Array<{
      id: string;
      sku: string;
      name: string;
      unit: string;
      cost: string | number;
      price: string | number;
      lowStockThreshold: number;
      stockLevels: Array<{ quantity: string | number }>;
      category: { name: string } | null;
    }>;
    categories: Array<{ id: string; name: string }>;
  };
}

async function fetchMovements() {
  const response = await fetch("/api/inventory/movements");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat movement");
  return payload.data as Array<{
    id: string;
    type: string;
    quantity: string | number;
    reference: string | null;
    note: string | null;
    createdAt: string;
    product: { sku: string; name: string };
    branch: { code: string; name: string };
  }>;
}

export function InventoryModule() {
  const queryClient = useQueryClient();

  const [openProduct, setOpenProduct] = useState(false);
  const [openMovement, setOpenMovement] = useState(false);

  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: movements = [] } = useQuery({ queryKey: ["stock-movements"], queryFn: fetchMovements });

  const products = productsData?.products ?? [];
  const categories = productsData?.categories ?? [];

  const createProduct = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambah produk");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpenProduct(false);
      toast.success("Produk berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createMovement = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mencatat movement");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpenMovement(false);
      toast.success("Stock movement berhasil disimpan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const productColumns = useMemo<ColumnDef<(typeof products)[number]>[]>(
    () => [
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "name", header: "Nama Produk" },
      { accessorKey: "category", header: "Kategori", cell: ({ row }) => row.original.category?.name ?? "-" },
      { accessorKey: "unit", header: "Unit" },
      { accessorKey: "cost", header: "Cost", cell: ({ row }) => formatCurrency(row.original.cost) },
      { accessorKey: "price", header: "Price", cell: ({ row }) => formatCurrency(row.original.price) },
      {
        id: "stock",
        header: "Total Stock",
        cell: ({ row }) => {
          const total = row.original.stockLevels.reduce((acc, item) => acc + toNumber(item.quantity), 0);
          const isLow = total <= row.original.lowStockThreshold;
          return (
            <div className="flex items-center gap-2">
              <span>{total}</span>
              {isLow ? <StatusBadge status="LOW" /> : null}
            </div>
          );
        },
      },
    ],
    [products],
  );

  const movementColumns = useMemo<ColumnDef<(typeof movements)[number]>[]>(
    () => [
      { accessorKey: "product", header: "Produk", cell: ({ row }) => `${row.original.product.sku} - ${row.original.product.name}` },
      { accessorKey: "type", header: "Tipe", cell: ({ row }) => <StatusBadge status={row.original.type} /> },
      { accessorKey: "quantity", header: "Qty" },
      { accessorKey: "branch", header: "Branch", cell: ({ row }) => row.original.branch.code },
      { accessorKey: "reference", header: "Ref", cell: ({ row }) => row.original.reference || "-" },
      { accessorKey: "createdAt", header: "Tanggal", cell: ({ row }) => formatDate(row.original.createdAt) },
    ],
    [movements],
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manajemen produk, stock level lintas branch, dan stock movement IN/OUT/TRANSFER."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/api/export/products">
                <Download className="h-4 w-4" /> Export Products CSV
              </a>
            </Button>
            <Dialog open={openMovement} onOpenChange={setOpenMovement}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MoveRight className="h-4 w-4" /> Stock Movement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stock Movement</DialogTitle>
                  <DialogDescription>Catat IN, OUT, atau TRANSFER stock.</DialogDescription>
                </DialogHeader>
                <form
                  id="movement-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createMovement.mutate({
                      productId: String(formData.get("productId") ?? ""),
                      type: String(formData.get("type") ?? "IN"),
                      quantity: toNumber(String(formData.get("quantity") ?? "0")),
                      reference: String(formData.get("reference") ?? "") || undefined,
                      note: String(formData.get("note") ?? "") || undefined,
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label>Produk</Label>
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
                  <div className="space-y-1.5">
                    <Label>Tipe</Label>
                    <Select name="type" defaultValue="IN">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">IN</SelectItem>
                        <SelectItem value="OUT">OUT</SelectItem>
                        <SelectItem value="TRANSFER">TRANSFER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="movement-qty">Qty</Label>
                    <Input id="movement-qty" name="quantity" type="number" min={1} step="1" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="movement-ref">Reference</Label>
                    <Input id="movement-ref" name="reference" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="movement-note">Note</Label>
                    <Input id="movement-note" name="note" />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="movement-form" disabled={createMovement.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openProduct} onOpenChange={setOpenProduct}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4" /> Produk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Produk</DialogTitle>
                  <DialogDescription>Buat item produk baru untuk inventory.</DialogDescription>
                </DialogHeader>
                <form
                  id="product-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createProduct.mutate({
                      sku: String(formData.get("sku") ?? ""),
                      name: String(formData.get("name") ?? ""),
                      categoryId: String(formData.get("categoryId") ?? "") || undefined,
                      unit: String(formData.get("unit") ?? "pcs"),
                      cost: toNumber(String(formData.get("cost") ?? "0")),
                      price: toNumber(String(formData.get("price") ?? "0")),
                      lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 0),
                    });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="product-sku">SKU</Label>
                      <Input id="product-sku" name="sku" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="product-unit">Unit</Label>
                      <Input id="product-unit" name="unit" defaultValue="pcs" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="product-name">Nama</Label>
                    <Input id="product-name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kategori</Label>
                    <Select name="categoryId">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="product-cost">Cost</Label>
                      <Input id="product-cost" name="cost" type="number" min={0} step="100" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="product-price">Price</Label>
                      <Input id="product-price" name="price" type="number" min={0} step="100" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="product-threshold">Low Stock Threshold</Label>
                    <Input id="product-threshold" name="lowStockThreshold" type="number" min={0} defaultValue={10} required />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="product-form" disabled={createProduct.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            {products.length === 0 ? (
              <EmptyState title="Belum ada produk" description="Tambahkan produk pertama untuk mulai mengelola stok." />
            ) : (
              <DataTable columns={productColumns} data={products} searchColumn="name" searchPlaceholder="Cari produk..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            {movements.length === 0 ? (
              <EmptyState title="Belum ada movement" description="Movement otomatis akan muncul dari PO receive / invoice issue." />
            ) : (
              <DataTable columns={movementColumns} data={movements} searchColumn="type" searchPlaceholder="Cari movement..." />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

