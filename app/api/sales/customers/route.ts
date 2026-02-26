import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    const customers = await prisma.customer.findMany({
      where: {
        orgId: user.orgId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(customers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = customerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        orgId: user.orgId,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        address: parsed.address || null,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "CUSTOMER",
      entityId: customer.id,
      details: { name: customer.name },
    });

    return ok(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
