import { InvoiceStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { nextDocNumber } from "@/lib/doc-number";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/schemas";

const actionSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["ISSUE"]),
});

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const invoices = await prisma.invoice.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        payments: {
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const payload = invoices.map((invoice) => ({
      ...invoice,
      paidAmount: invoice.payments.reduce((acc, payment) => acc + Number(payment.amount), 0),
    }));

    return ok(payload);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = invoiceSchema.parse(body);

    const customer = await prisma.customer.findFirst({
      where: {
        id: parsed.customerId,
        orgId: user.orgId,
      },
    });

    if (!customer) {
      return fail("Customer tidak ditemukan", 404);
    }

    const branchId =
      user.branchId ??
      (
        await prisma.branch.findFirst({
          where: { orgId: user.orgId },
          orderBy: { createdAt: "asc" },
        })
      )?.id;

    if (!branchId) {
      return fail("Branch tidak ditemukan", 400);
    }

    const invoiceCount = await prisma.invoice.count({ where: { orgId: user.orgId } });
    const invoiceNumber = nextDocNumber("INV", invoiceCount);

    const subtotal = parsed.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * (parsed.taxPercent / 100);
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        orgId: user.orgId,
        branchId,
        customerId: parsed.customerId,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        notes: parsed.notes || null,
        subtotal: decimal(subtotal),
        tax: decimal(tax),
        total: decimal(total),
        items: {
          create: parsed.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: decimal(item.quantity),
            unitPrice: decimal(item.unitPrice),
            lineTotal: decimal(item.quantity * item.unitPrice),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId,
      userId: user.id,
      action: "CREATE",
      entity: "INVOICE",
      entityId: invoice.id,
      details: { invoiceNumber, status: "DRAFT" },
    });

    return ok(invoice, { status: 201 });
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parsed.id,
        orgId: user.orgId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return fail("Invoice tidak ditemukan", 404);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      return fail("Hanya invoice draft yang bisa di-issue", 400);
    }

    await prisma.$transaction(async (trx) => {
      for (const item of invoice.items) {
        if (!item.productId) continue;

        const existing = await trx.stockLevel.findUnique({
          where: {
            orgId_branchId_productId: {
              orgId: user.orgId,
              branchId: invoice.branchId,
              productId: item.productId,
            },
          },
        });

        const quantityOut = Number(item.quantity);
        const available = Number(existing?.quantity ?? 0);

        if (available < quantityOut) {
          throw new Error(`Stok tidak cukup untuk item ${item.description}`);
        }

        if (!existing) {
          await trx.stockLevel.create({
            data: {
              orgId: user.orgId,
              branchId: invoice.branchId,
              productId: item.productId,
              quantity: decimal(-quantityOut),
            },
          });
        } else {
          await trx.stockLevel.update({
            where: {
              orgId_branchId_productId: {
                orgId: user.orgId,
                branchId: invoice.branchId,
                productId: item.productId,
              },
            },
            data: {
              quantity: {
                decrement: decimal(quantityOut),
              },
            },
          });
        }

        await trx.stockMovement.create({
          data: {
            orgId: user.orgId,
            branchId: invoice.branchId,
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            reference: invoice.invoiceNumber,
            note: "Invoice issued",
          },
        });
      }

      await trx.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.ISSUED },
      });

      await trx.auditLog.create({
        data: {
          orgId: user.orgId,
          branchId: invoice.branchId,
          userId: user.id,
          action: "STATUS_CHANGE",
          entity: "INVOICE",
          entityId: invoice.id,
          details: { from: "DRAFT", to: "ISSUED", invoiceNumber: invoice.invoiceNumber },
        },
      });
    });

    const updated = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
