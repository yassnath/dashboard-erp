import { toCsv } from "@/lib/csv";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { orgId: user.orgId },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const csv = toCsv(
    products.map((item) => ({
      sku: item.sku,
      name: item.name,
      category: item.category?.name ?? "",
      unit: item.unit,
      cost: Number(item.cost),
      price: Number(item.price),
      lowStockThreshold: item.lowStockThreshold,
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
