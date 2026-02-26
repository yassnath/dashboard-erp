import { Role } from "@prisma/client";

import { AuditLogsModule } from "@/components/modules/audit-logs-module";
import { requireRole } from "@/lib/session";

export default async function AuditLogsPage() {
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);

  return <AuditLogsModule />;
}
