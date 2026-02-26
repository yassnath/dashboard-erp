import { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { attendanceSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const attendances = await prisma.attendance.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        employee: {
          select: {
            name: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return ok(attendances);
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
    const parsed = attendanceSchema.parse(body);

    const employee = await prisma.employee.findFirst({
      where: {
        id: parsed.employeeId,
        orgId: user.orgId,
      },
    });

    if (!employee) {
      return fail("Employee tidak ditemukan", 404);
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: parsed.employeeId,
          date: new Date(parsed.date),
        },
      },
      create: {
        orgId: user.orgId,
        branchId: employee.branchId,
        employeeId: employee.id,
        date: new Date(parsed.date),
        status: parsed.status,
        hours: decimal(parsed.hours),
        note: parsed.note || null,
      },
      update: {
        status: parsed.status,
        hours: decimal(parsed.hours),
        note: parsed.note || null,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: employee.branchId,
      userId: user.id,
      action: "POST",
      entity: "ATTENDANCE",
      entityId: attendance.id,
      details: { employeeId: employee.id, status: parsed.status },
    });

    return ok(attendance, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
