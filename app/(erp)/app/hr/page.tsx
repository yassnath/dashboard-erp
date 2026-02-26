import { Role } from "@prisma/client";

import { HrModule } from "@/components/modules/hr-module";
import { requireRole } from "@/lib/session";

export default async function HrPage() {
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER]);

  return <HrModule />;
}
