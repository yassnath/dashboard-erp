import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";

const updateSchema = productSchema.extend({
  id: z.string().cuid(),
});

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          orgId: user.orgId,
        },
        include: {
          category: true,
          stockLevels: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: { orgId: user.orgId },
        orderBy: { name: "asc" },
      }),
    ]);

    return ok({ products, categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        orgId: user.orgId,
        sku: parsed.sku,
        name: parsed.name,
        categoryId: parsed.categoryId || null,
        unit: parsed.unit,
        cost: decimal(parsed.cost),
        price: decimal(parsed.price),
        lowStockThreshold: parsed.lowStockThreshold,
      },
    });

    const branches = await prisma.branch.findMany({
      where: { orgId: user.orgId },
      select: { id: true },
    });

    await prisma.stockLevel.createMany({
      data: branches.map((branch) => ({
        orgId: user.orgId,
        branchId: branch.id,
        productId: product.id,
        quantity: decimal(0),
      })),
      skipDuplicates: true,
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "PRODUCT",
      entityId: product.id,
      details: { sku: product.sku, name: product.name },
    });

    return ok(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const product = await prisma.product.findFirst({
      where: {
        id: parsed.id,
        orgId: user.orgId,
      },
    });

    if (!product) {
      return fail("Produk tidak ditemukan", 404);
    }

    const updated = await prisma.product.update({
      where: {
        id: parsed.id,
      },
      data: {
        sku: parsed.sku,
        name: parsed.name,
        categoryId: parsed.categoryId || null,
        unit: parsed.unit,
        cost: decimal(parsed.cost),
        price: decimal(parsed.price),
        lowStockThreshold: parsed.lowStockThreshold,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "UPDATE",
      entity: "PRODUCT",
      entityId: updated.id,
      details: { sku: updated.sku, name: updated.name },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
