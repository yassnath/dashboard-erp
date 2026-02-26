import { InvoiceStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const payments = await prisma.payment.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    return ok(payments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = paymentSchema.parse(body);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parsed.invoiceId,
        orgId: user.orgId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return fail("Invoice tidak ditemukan", 404);
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      return fail("Invoice harus di-issue sebelum pembayaran", 400);
    }

    const payment = await prisma.payment.create({
      data: {
        orgId: user.orgId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        amount: decimal(parsed.amount),
        method: parsed.method,
        reference: parsed.reference || null,
      },
    });

    const paidAmount = invoice.payments.reduce((acc, item) => acc + Number(item.amount), 0) + parsed.amount;
    const total = Number(invoice.total);

    if (paidAmount >= total) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
        },
      });

      await createAuditLog({
        orgId: user.orgId,
        branchId: invoice.branchId,
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "INVOICE",
        entityId: invoice.id,
        details: { from: invoice.status, to: "PAID", invoiceNumber: invoice.invoiceNumber },
      });
    }

    await createAuditLog({
      orgId: user.orgId,
      branchId: invoice.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "PAYMENT",
      entityId: payment.id,
      details: { invoiceNumber: invoice.invoiceNumber, amount: parsed.amount },
    });

    return ok(payment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
