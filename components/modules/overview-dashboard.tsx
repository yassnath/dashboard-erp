"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { BreakdownChart } from "@/components/charts/breakdown-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiCard } from "@/components/modules/kpi-card";
import { PageHeader } from "@/components/modules/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/format";

const ranges = ["7d", "30d", "90d"] as const;

async function getOverview(range: string) {
  const response = await fetch(`/api/overview?range=${range}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Gagal memuat overview");
  }
  return payload.data;
}

function formatNetProfitDisplay(value: number) {
  const base = formatCurrency(Math.abs(value)).replace(/\u00A0/g, " ");
  if (value > 0) return `+${base}`;
  if (value < 0) return `-${base}`;
  return formatCurrency(0).replace(/\u00A0/g, " ");
}

export function OverviewDashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]>("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["overview", range],
    queryFn: () => getOverview(range),
  });
  const netProfit = Number(data?.kpis?.netProfit ?? 0);
  const netProfitTone = netProfit > 0 ? "positive" : netProfit < 0 ? "negative" : "neutral";

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Ringkasan KPI lintas modul: sales, expense, inventory, approval."
        actions={
          <div className="rounded-2xl border border-border/70 bg-panel/60 p-1">
            {ranges.map((value) => (
              <Button
                key={value}
                variant={range === value ? "default" : "ghost"}
                size="sm"
                onClick={() => setRange(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="text-sm text-red-300">Terjadi error saat memuat overview dashboard.</Card>
      ) : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard label="Revenue" value={formatCurrency(data.kpis.revenue)} delta={`${range} window`} tone="positive" variant="cyan" />
            <KpiCard label="Expenses" value={formatCurrency(data.kpis.expenses)} tone="negative" variant="orange" />
            <KpiCard
              label="Net Profit"
              value={formatNetProfitDisplay(netProfit)}
              tone={netProfitTone}
              valueTone={netProfitTone}
              variant="green"
            />
            <KpiCard label="AR" value={formatCurrency(data.kpis.ar)} variant="violet" />
            <KpiCard label="AP" value={formatCurrency(data.kpis.ap)} variant="amber" />
            <KpiCard label="Low Stock / Pending Approvals" value={`${data.kpis.lowStock} / ${data.kpis.pendingApprovals}`} variant="rose" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.7fr,1fr]">
            <Card>
              <h3 className="mb-3 text-base font-semibold">Revenue vs Expenses Trend</h3>
              <TrendChart data={data.trend} />
            </Card>
            <Card>
              <h3 className="mb-3 text-base font-semibold">Financial Breakdown</h3>
              <BreakdownChart data={data.breakdown} />
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 text-base font-semibold">Activity Feed</h3>
            <div className="space-y-2">
              {data.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>
              ) : (
                data.activity.map((item: { id: string; type: string; title: string; timestamp: string }) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-3 py-2 text-sm">
                    <span className="capitalize">[{item.type}] {item.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(item.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

