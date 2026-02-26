import { ExpenseStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/schemas";

const actionSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["MARK_PAID"]),
});

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const expenses = await prisma.expense.findMany({
      where: {
        orgId: user.orgId,
      },
      orderBy: { date: "desc" },
    });

    return ok(expenses);
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
    const parsed = expenseSchema.parse(body);

    const status = ["SUPER_ADMIN", "ORG_ADMIN", "MANAGER"].includes(user.role)
      ? ExpenseStatus.APPROVED
      : ExpenseStatus.SUBMITTED;

    const expense = await prisma.$transaction(async (trx) => {
      const createdExpense = await trx.expense.create({
        data: {
          orgId: user.orgId,
          branchId: user.branchId!,
          vendor: parsed.vendor,
          category: parsed.category,
          amount: decimal(parsed.amount),
          status,
          date: new Date(parsed.date),
          note: parsed.note || null,
          attachment: parsed.attachment || null,
          createdById: user.id,
          approvedById: status === ExpenseStatus.APPROVED ? user.id : null,
        },
      });

      if (status === ExpenseStatus.SUBMITTED) {
        await trx.approval.create({
          data: {
            orgId: user.orgId,
            branchId: user.branchId,
            entityType: "EXPENSE",
            entityId: createdExpense.id,
            status: "PENDING",
            requestedById: user.id,
          },
        });
      }

      await trx.auditLog.create({
        data: {
          orgId: user.orgId,
          branchId: user.branchId,
          userId: user.id,
          action: "CREATE",
          entity: "EXPENSE",
          entityId: createdExpense.id,
          details: { amount: parsed.amount, status },
        },
      });

      return createdExpense;
    });

    return ok(expense, { status: 201 });
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

    const expense = await prisma.expense.findFirst({
      where: {
        id: parsed.id,
        orgId: user.orgId,
      },
    });

    if (!expense) {
      return fail("Expense tidak ditemukan", 404);
    }

    if (expense.status !== ExpenseStatus.APPROVED) {
      return fail("Expense harus approved sebelum ditandai paid", 400);
    }

    const updated = await prisma.expense.update({
      where: { id: expense.id },
      data: { status: ExpenseStatus.PAID },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: expense.branchId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "EXPENSE",
      entityId: expense.id,
      details: { from: expense.status, to: "PAID" },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
