import { NextRequest } from "next/server";
import { subDays } from "date-fns";

import { fail, handleApiError, ok } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

const rangeMap: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const range = request.nextUrl.searchParams.get("range") ?? "30d";
    const days = rangeMap[range] ?? 30;
    const fromDate = subDays(new Date(), days);

    const [
      invoices,
      expenses,
      stockLevels,
      pendingApprovals,
      recentApprovals,
      recentInvoices,
      recentMovements,
      payments,
      openPO,
    ] =
      await Promise.all([
        prisma.invoice.findMany({
          where: {
            orgId: user.orgId,
            issueDate: { gte: fromDate },
          },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            issueDate: true,
          },
        }),
        prisma.expense.findMany({
          where: {
            orgId: user.orgId,
            date: { gte: fromDate },
          },
          select: {
            amount: true,
            date: true,
          },
        }),
        prisma.stockLevel.findMany({
          where: {
            orgId: user.orgId,
          },
          select: {
            quantity: true,
            product: {
              select: {
                lowStockThreshold: true,
              },
            },
          },
        }),
        prisma.approval.count({
          where: {
            orgId: user.orgId,
            status: "PENDING",
          },
        }),
        prisma.approval.findMany({
          where: {
            orgId: user.orgId,
          },
          take: 5,
          orderBy: { requestedAt: "desc" },
          select: {
            id: true,
            status: true,
            entityType: true,
            requestedAt: true,
            note: true,
          },
        }),
        prisma.invoice.findMany({
          where: {
            orgId: user.orgId,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        }),
        prisma.stockMovement.findMany({
          where: {
            orgId: user.orgId,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            quantity: true,
            reference: true,
            createdAt: true,
          },
        }),
        prisma.payment.aggregate({
          where: { orgId: user.orgId },
          _sum: { amount: true },
        }),
        prisma.purchaseOrder.aggregate({
          where: {
            orgId: user.orgId,
            status: {
              in: ["DRAFT", "ISSUED"],
            },
          },
          _sum: { total: true },
        }),
      ]);

    const lowStock = stockLevels.filter(
      (item) => Number(item.quantity) <= item.product.lowStockThreshold,
    ).length;

    const revenue = invoices.reduce((acc, invoice) => acc + Number(invoice.total), 0);
    const expenseTotal = expenses.reduce((acc, expense) => acc + Number(expense.amount), 0);
    const netProfit = revenue - expenseTotal;
    const receivedPayment = Number(payments._sum.amount ?? 0);
    const ar = invoices
      .filter((item) => item.status !== "PAID")
      .reduce((acc, invoice) => acc + Number(invoice.total), 0);
    const ap = Number(openPO._sum.total ?? 0);

    const trendMap = new Map<string, { revenue: number; expenses: number }>();

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = subDays(new Date(), offset);
      trendMap.set(formatDate(date), { revenue: 0, expenses: 0 });
    }

    invoices.forEach((invoice) => {
      const key = formatDate(invoice.issueDate);
      const current = trendMap.get(key);
      if (current) {
        current.revenue += Number(invoice.total);
      }
    });

    expenses.forEach((expense) => {
      const key = formatDate(expense.date);
      const current = trendMap.get(key);
      if (current) {
        current.expenses += Number(expense.amount);
      }
    });

    const trend = Array.from(trendMap.entries()).map(([date, value]) => ({
      date,
      revenue: Math.round(value.revenue),
      expenses: Math.round(value.expenses),
    }));

    const breakdown = [
      { name: "Revenue", value: revenue },
      { name: "Expenses", value: expenseTotal },
      { name: "Received Payment", value: receivedPayment },
      { name: "Outstanding AR", value: ar },
    ];

    const activity = [
      ...recentInvoices.map((invoice) => ({
        id: invoice.id,
        type: "invoice",
        title: `${invoice.invoiceNumber} ${invoice.status.toLowerCase()}`,
        timestamp: invoice.createdAt,
      })),
      ...recentApprovals.map((approval) => ({
        id: approval.id,
        type: "approval",
        title: `${approval.entityType} ${approval.status.toLowerCase()}`,
        timestamp: approval.requestedAt,
      })),
      ...recentMovements.map((movement) => ({
        id: movement.id,
        type: "stock",
        title: `Stock ${movement.type} ${Number(movement.quantity)} (${movement.reference ?? "manual"})`,
        timestamp: movement.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);

    return ok({
      range,
      kpis: {
        revenue,
        expenses: expenseTotal,
        netProfit,
        ar,
        ap,
        lowStock,
        pendingApprovals,
      },
      trend,
      breakdown,
      activity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
