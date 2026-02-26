import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: { orgId: user.orgId },
    orderBy: { date: "desc" },
  });

  const csv = toCsv(
    expenses.map((item) => ({
      vendor: item.vendor,
      category: item.category,
      status: item.status,
      date: formatDate(item.date),
      amount: Number(item.amount),
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
