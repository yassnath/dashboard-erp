import { Role } from "@prisma/client";

import { FinanceModule } from "@/components/modules/finance-module";
import { requireRole } from "@/lib/session";

export default async function FinancePage() {
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER]);

  return <FinanceModule />;
}
