import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { orgId: user.orgId },
    include: {
      customer: {
        select: { name: true },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const csv = toCsv(
    invoices.map((item) => ({
      invoiceNumber: item.invoiceNumber,
      customer: item.customer.name,
      status: item.status,
      issueDate: formatDate(item.issueDate),
      total: Number(item.total),
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
