import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { stockMovementSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const movements = await prisma.stockMovement.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
        branch: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok(movements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);
    if (!user.branchId) return fail("User tidak terikat branch", 400);

    const body = await request.json();
    const parsed = stockMovementSchema.parse(body);

    const product = await prisma.product.findFirst({
      where: {
        id: parsed.productId,
        orgId: user.orgId,
      },
    });

    if (!product) {
      return fail("Produk tidak ditemukan", 404);
    }

    await prisma.$transaction(async (trx) => {
      const stock = await trx.stockLevel.findUnique({
        where: {
          orgId_branchId_productId: {
            orgId: user.orgId,
            branchId: user.branchId!,
            productId: product.id,
          },
        },
      });

      const currentQty = Number(stock?.quantity ?? 0);
      const qty = parsed.quantity;

      if (parsed.type === "OUT" && currentQty < qty) {
        throw new Error("Stok tidak cukup");
      }

      const adjustment = parsed.type === "OUT" ? -qty : qty;

      if (!stock) {
        await trx.stockLevel.create({
          data: {
            orgId: user.orgId,
            branchId: user.branchId!,
            productId: product.id,
            quantity: decimal(Math.max(0, adjustment)),
          },
        });
      } else {
        await trx.stockLevel.update({
          where: {
            orgId_branchId_productId: {
              orgId: user.orgId,
              branchId: user.branchId!,
              productId: product.id,
            },
          },
          data: {
            quantity: {
              increment: decimal(adjustment),
            },
          },
        });
      }

      await trx.stockMovement.create({
        data: {
          orgId: user.orgId,
          branchId: user.branchId!,
          productId: product.id,
          type: parsed.type,
          quantity: decimal(parsed.quantity),
          toBranchId: parsed.toBranchId,
          reference: parsed.reference || null,
          note: parsed.note || null,
        },
      });

      if (parsed.type === "TRANSFER" && parsed.toBranchId) {
        await trx.stockLevel.upsert({
          where: {
            orgId_branchId_productId: {
              orgId: user.orgId,
              branchId: parsed.toBranchId,
              productId: product.id,
            },
          },
          create: {
            orgId: user.orgId,
            branchId: parsed.toBranchId,
            productId: product.id,
            quantity: decimal(parsed.quantity),
          },
          update: {
            quantity: {
              increment: decimal(parsed.quantity),
            },
          },
        });
      }
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "POST",
      entity: "STOCK_MOVEMENT",
      entityId: product.id,
      details: { type: parsed.type, quantity: parsed.quantity, sku: product.sku },
    });

    return ok({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
