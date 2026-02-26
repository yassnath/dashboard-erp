import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const suppliers = await prisma.supplier.findMany({
      where: { orgId: user.orgId },
      orderBy: { name: "asc" },
    });

    return ok(suppliers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = supplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
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
      entity: "SUPPLIER",
      entityId: supplier.id,
      details: { name: supplier.name },
    });

    return ok(supplier, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
