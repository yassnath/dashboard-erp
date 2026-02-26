import { PurchaseRequestStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { nextDocNumber } from "@/lib/doc-number";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { purchaseRequestSchema } from "@/lib/schemas";

const actionSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["SUBMIT"]),
});

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const requests = await prisma.purchaseRequest.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        supplier: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        approvals: true,
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

    return ok(requests);
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
    const parsed = purchaseRequestSchema.parse(body);

    const count = await prisma.purchaseRequest.count({ where: { orgId: user.orgId } });
    const number = nextDocNumber("PR", count);

    const pr = await prisma.purchaseRequest.create({
      data: {
        orgId: user.orgId,
        branchId: user.branchId,
        supplierId: parsed.supplierId || null,
        number,
        status: PurchaseRequestStatus.DRAFT,
        note: parsed.note || null,
        createdById: user.id,
        items: {
          create: parsed.items.map((item) => ({
            productId: item.productId,
            quantity: decimal(item.quantity),
            unitCost: decimal(item.unitCost),
            lineTotal: decimal(item.quantity * item.unitCost),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "PURCHASE_REQUEST",
      entityId: pr.id,
      details: { number: pr.number, status: "DRAFT" },
    });

    return ok(pr, { status: 201 });
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

    const pr = await prisma.purchaseRequest.findFirst({
      where: {
        id: parsed.id,
        orgId: user.orgId,
      },
    });

    if (!pr) {
      return fail("Purchase request tidak ditemukan", 404);
    }

    if (pr.status !== PurchaseRequestStatus.DRAFT) {
      return fail("Hanya PR draft yang bisa disubmit", 400);
    }

    const updated = await prisma.$transaction(async (trx) => {
      const updatedPr = await trx.purchaseRequest.update({
        where: { id: pr.id },
        data: {
          status: PurchaseRequestStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      const approval = await trx.approval.create({
        data: {
          orgId: user.orgId,
          branchId: pr.branchId,
          entityType: "PURCHASE_REQUEST",
          entityId: pr.id,
          status: "PENDING",
          requestedById: user.id,
          purchaseRequestId: pr.id,
        },
      });

      await trx.auditLog.create({
        data: {
          orgId: user.orgId,
          branchId: pr.branchId,
          userId: user.id,
          action: "SUBMIT",
          entity: "PURCHASE_REQUEST",
          entityId: pr.id,
          details: { number: pr.number, approvalId: approval.id },
        },
      });

      return updatedPr;
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
