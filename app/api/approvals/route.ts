import { ApprovalStatus, PurchaseRequestStatus, Role } from "@prisma/client";
import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { hasAnyRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { approvalDecisionSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const where = {
      orgId: user.orgId,
      status: ApprovalStatus.PENDING,
    } as const;

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            name: true,
          },
        },
        purchaseRequest: {
          select: {
            number: true,
            status: true,
            note: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return ok(approvals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    if (!hasAnyRole(user.role, [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER])) {
      return fail("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = approvalDecisionSchema.parse(body);

    const approval = await prisma.approval.findFirst({
      where: {
        id: parsed.approvalId,
        orgId: user.orgId,
      },
    });

    if (!approval) {
      return fail("Approval tidak ditemukan", 404);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return fail("Approval sudah diproses", 400);
    }

    const decision = parsed.decision;

    await prisma.$transaction(async (trx) => {
      await trx.approval.update({
        where: { id: approval.id },
        data: {
          status: decision,
          note: parsed.note,
          approverId: user.id,
          actedAt: new Date(),
        },
      });

      if (approval.entityType === "PURCHASE_REQUEST" && approval.purchaseRequestId) {
        await trx.purchaseRequest.update({
          where: { id: approval.purchaseRequestId },
          data:
            decision === "APPROVED"
              ? {
                  status: PurchaseRequestStatus.APPROVED,
                  approvedAt: new Date(),
                }
              : {
                  status: PurchaseRequestStatus.REJECTED,
                  rejectedAt: new Date(),
                },
        });
      }

      if (approval.entityType === "EXPENSE") {
        await trx.expense.update({
          where: { id: approval.entityId },
          data:
            decision === "APPROVED"
              ? { status: "APPROVED", approvedById: user.id }
              : { status: "REJECTED", approvedById: user.id },
        });
      }

      await trx.auditLog.create({
        data: {
          orgId: user.orgId,
          branchId: approval.branchId,
          userId: user.id,
          action: decision,
          entity: approval.entityType,
          entityId: approval.entityId,
          details: { note: parsed.note ?? null },
        },
      });
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: approval.branchId,
      userId: user.id,
      action: decision,
      entity: approval.entityType,
      entityId: approval.entityId,
      details: { note: parsed.note },
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
