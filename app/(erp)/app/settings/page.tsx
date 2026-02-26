import { Role } from "@prisma/client";

import { SettingsModule } from "@/components/modules/settings-module";
import { requireRole } from "@/lib/session";

export default async function SettingsPage() {
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);

  return <SettingsModule />;
}
