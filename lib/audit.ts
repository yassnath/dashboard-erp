import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AuditParams = {
  orgId: string;
  branchId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
};

export async function createAuditLog(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      orgId: params.orgId,
      branchId: params.branchId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
    },
  });
}
