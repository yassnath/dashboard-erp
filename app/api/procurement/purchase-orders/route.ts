import { PurchaseOrderStatus, PurchaseRequestStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { nextDocNumber } from "@/lib/doc-number";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  purchaseRequestId: z.string().cuid(),
  note: z.string().max(255).optional(),
});

const actionSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["RECEIVE"]),
});

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const orders = await prisma.purchaseOrder.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        supplier: true,
        purchaseRequest: {
          select: {
            number: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const pr = await prisma.purchaseRequest.findFirst({
      where: {
        id: parsed.purchaseRequestId,
        orgId: user.orgId,
      },
      include: {
        items: true,
      },
    });

    if (!pr) {
      return fail("PR tidak ditemukan", 404);
    }

    if (pr.status !== PurchaseRequestStatus.APPROVED) {
      return fail("PR harus status approved sebelum dibuat PO", 400);
    }

    const existingPo = await prisma.purchaseOrder.findFirst({
      where: {
        purchaseRequestId: pr.id,
      },
    });

    if (existingPo) {
      return fail("PO untuk PR ini sudah ada", 400);
    }

    const total = pr.items.reduce((acc, item) => acc + Number(item.lineTotal), 0);
    const count = await prisma.purchaseOrder.count({ where: { orgId: user.orgId } });
    const number = nextDocNumber("PO", count);

    const po = await prisma.$transaction(async (trx) => {
      const createdPo = await trx.purchaseOrder.create({
        data: {
          orgId: user.orgId,
          branchId: pr.branchId,
          supplierId: pr.supplierId,
          purchaseRequestId: pr.id,
          number,
          status: PurchaseOrderStatus.ISSUED,
          issuedAt: new Date(),
          total: decimal(total),
          note: parsed.note || null,
          createdById: user.id,
          items: {
            create: pr.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      await trx.purchaseRequest.update({
        where: { id: pr.id },
        data: {
          status: PurchaseRequestStatus.CONVERTED,
        },
      });

      await trx.auditLog.create({
        data: {
          orgId: user.orgId,
          branchId: pr.branchId,
          userId: user.id,
          action: "CREATE",
          entity: "PURCHASE_ORDER",
          entityId: createdPo.id,
          details: { number: createdPo.number, fromPr: pr.number },
        },
      });

      return createdPo;
    });

    return ok(po, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = actionSchema.parse(body);

    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: parsed.id,
        orgId: user.orgId,
      },
      include: {
        items: true,
      },
    });

    if (!po) {
      return fail("PO tidak ditemukan", 404);
    }

    if (po.status !== PurchaseOrderStatus.ISSUED) {
      return fail("PO harus status issued untuk penerimaan stok", 400);
    }

    await prisma.$transaction(async (trx) => {
      await trx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          receivedAt: new Date(),
        },
      });

      for (const item of po.items) {
        await trx.stockLevel.upsert({
          where: {
            orgId_branchId_productId: {
              orgId: user.orgId,
              branchId: po.branchId,
              productId: item.productId,
            },
          },
          create: {
            orgId: user.orgId,
            branchId: po.branchId,
            productId: item.productId,
            quantity: item.quantity,
          },
          update: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        await trx.stockMovement.create({
          data: {
            orgId: user.orgId,
            branchId: po.branchId,
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            reference: po.number,
            note: "PO received",
          },
        });
      }

      await trx.auditLog.create({
        data: {
          orgId: user.orgId,
          branchId: po.branchId,
          userId: user.id,
          action: "POST",
          entity: "PURCHASE_ORDER",
          entityId: po.id,
          details: { number: po.number, status: "RECEIVED" },
        },
      });
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: po.branchId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "PURCHASE_ORDER",
      entityId: po.id,
      details: { from: "ISSUED", to: "RECEIVED" },
    });

    const updated = await prisma.purchaseOrder.findUnique({ where: { id: po.id } });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
