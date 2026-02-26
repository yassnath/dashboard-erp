import { NextRequest } from "next/server";

import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 10), 200);

    const logs = await prisma.auditLog.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return ok(logs);
  } catch (error) {
    return handleApiError(error);
  }
}
