"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/format";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

type BreakdownPoint = {
  name: string;
  value: number;
};

function getBreakdownColor(name: string, index: number) {
  if (name.toLowerCase().includes("expense")) {
    return "var(--chart-7)";
  }
  return COLORS[index % COLORS.length];
}

export function BreakdownChart({ data }: { data: BreakdownPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="86%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={96}
            paddingAngle={3}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${entry.value}`} fill={getBreakdownColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: 16,
              color: "var(--tooltip-text)",
            }}
            labelStyle={{ color: "var(--tooltip-text)" }}
            itemStyle={{ color: "var(--tooltip-text)" }}
            formatter={(value) =>
              formatCurrency(typeof value === "number" ? value : 0)
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap gap-2 px-2">
        {data.map((item, index) => (
          <div key={item.name} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-1 text-[11px]">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getBreakdownColor(item.name, index) }}
              aria-hidden
            />
            <span className="text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
