import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const employees = await prisma.employee.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        branch: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(employees);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);
    if (!user.branchId) return fail("User tidak terikat branch", 400);

    const body = await request.json();
    const parsed = employeeSchema.parse(body);

    const employee = await prisma.employee.create({
      data: {
        orgId: user.orgId,
        branchId: user.branchId,
        employeeCode: parsed.employeeCode,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        position: parsed.position,
        baseSalary: decimal(parsed.baseSalary),
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "EMPLOYEE",
      entityId: employee.id,
      details: { employeeCode: employee.employeeCode, name: employee.name },
    });

    return ok(employee, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
