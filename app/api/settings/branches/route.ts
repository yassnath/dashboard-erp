import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { branchSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const branches = await prisma.branch.findMany({
      where: {
        orgId: user.orgId,
      },
      orderBy: { name: "asc" },
    });

    return ok(branches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    if (!["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role)) {
      return fail("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = branchSchema.parse(body);

    const branch = await prisma.$transaction(async (trx) => {
      const createdBranch = await trx.branch.create({
        data: {
          orgId: user.orgId,
          name: parsed.name,
          code: parsed.code,
          address: parsed.address || null,
        },
      });

      const products = await trx.product.findMany({
        where: {
          orgId: user.orgId,
        },
        select: {
          id: true,
        },
      });

      if (products.length > 0) {
        await trx.stockLevel.createMany({
          data: products.map((product) => ({
            orgId: user.orgId,
            branchId: createdBranch.id,
            productId: product.id,
            quantity: decimal(0),
          })),
          skipDuplicates: true,
        });
      }

      return createdBranch;
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: branch.id,
      userId: user.id,
      action: "CREATE",
      entity: "BRANCH",
      entityId: branch.id,
      details: { code: branch.code, name: branch.name },
    });

    return ok(branch, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
