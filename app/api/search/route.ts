import { NextRequest } from "next/server";

import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return ok([]);
    }

    const [customers, invoices, products, suppliers] = await Promise.all([
      prisma.customer.findMany({
        where: {
          orgId: user.orgId,
          name: { contains: query, mode: "insensitive" },
        },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: {
          orgId: user.orgId,
          invoiceNumber: { contains: query, mode: "insensitive" },
        },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          orgId: user.orgId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.supplier.findMany({
        where: {
          orgId: user.orgId,
          name: { contains: query, mode: "insensitive" },
        },
        take: 5,
      }),
    ]);

    const payload = [
      ...customers.map((item) => ({
        type: "customer" as const,
        id: item.id,
        name: item.name,
        subtitle: item.email ?? "Customer",
        href: "/app/sales",
      })),
      ...invoices.map((item) => ({
        type: "invoice" as const,
        id: item.id,
        name: item.invoiceNumber,
        subtitle: item.status,
        href: "/app/sales",
      })),
      ...products.map((item) => ({
        type: "product" as const,
        id: item.id,
        name: item.name,
        subtitle: item.sku,
        href: "/app/inventory",
      })),
      ...suppliers.map((item) => ({
        type: "supplier" as const,
        id: item.id,
        name: item.name,
        subtitle: item.email ?? "Supplier",
        href: "/app/procurement",
      })),
    ];

    return ok(payload.slice(0, 20));
  } catch (error) {
    return handleApiError(error);
  }
}
