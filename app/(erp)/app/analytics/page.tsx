import { requireSessionUser } from "@/lib/session";

import { OverviewDashboard } from "@/components/modules/overview-dashboard";

export default async function AnalyticsPage() {
  await requireSessionUser();

  return <OverviewDashboard />;
}
