import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { projectSchema, taskSchema } from "@/lib/schemas";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE_TASK"),
    payload: taskSchema,
  }),
  z.object({
    action: z.literal("MOVE_TASK"),
    payload: z.object({
      taskId: z.string().cuid(),
      status: z.enum(["BACKLOG", "IN_PROGRESS", "DONE"]),
    }),
  }),
  z.object({
    action: z.literal("DELETE_TASK"),
    payload: z.object({
      taskId: z.string().cuid(),
    }),
  }),
]);

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const projects = await prisma.project.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                name: true,
                employeeCode: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(projects);
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
    const parsed = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        orgId: user.orgId,
        branchId: user.branchId,
        code: parsed.code,
        name: parsed.name,
        client: parsed.client || null,
        budget: decimal(parsed.budget),
        status: parsed.status,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        createdById: user.id,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "PROJECT",
      entityId: project.id,
      details: { code: project.code, name: project.name },
    });

    return ok(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.action === "CREATE_TASK") {
      const payload = parsed.payload;

      const project = await prisma.project.findFirst({
        where: {
          id: payload.projectId,
          orgId: user.orgId,
        },
      });

      if (!project) {
        return fail("Project tidak ditemukan", 404);
      }

      const task = await prisma.task.create({
        data: {
          orgId: user.orgId,
          branchId: project.branchId,
          projectId: payload.projectId,
          title: payload.title,
          description: payload.description || null,
          status: payload.status,
          assigneeId: payload.assigneeId || null,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        },
      });

      await createAuditLog({
        orgId: user.orgId,
        branchId: project.branchId,
        userId: user.id,
        action: "CREATE",
        entity: "TASK",
        entityId: task.id,
        details: { projectId: project.id, title: task.title },
      });

      return ok(task, { status: 201 });
    }

    const taskId = parsed.payload.taskId;
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        orgId: user.orgId,
      },
    });

    if (!task) {
      return fail("Task tidak ditemukan", 404);
    }

    if (parsed.action === "DELETE_TASK") {
      await prisma.task.delete({
        where: { id: task.id },
      });

      await createAuditLog({
        orgId: user.orgId,
        branchId: task.branchId,
        userId: user.id,
        action: "DELETE",
        entity: "TASK",
        entityId: task.id,
        details: { title: task.title, projectId: task.projectId },
      });

      return ok({ success: true });
    }

    const updated = await prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: parsed.payload.status,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: task.branchId,
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "TASK",
      entityId: task.id,
      details: { from: task.status, to: parsed.payload.status },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
