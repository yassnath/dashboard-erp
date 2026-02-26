"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/format";

type TrendPoint = {
  date: string;
  revenue: number;
  expenses: number;
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
              <stop offset="55%" stopColor="var(--chart-2)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--chart-6)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-7)" stopOpacity={0.45} />
              <stop offset="55%" stopColor="var(--chart-7)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--chart-7)" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--grid-line)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.round(value / 1000000)}Jt`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: 16,
              color: "var(--tooltip-text)",
            }}
            labelStyle={{ color: "var(--tooltip-text)" }}
            itemStyle={{ color: "var(--tooltip-text)" }}
            formatter={(value, name) => [
              formatCurrency(typeof value === "number" ? value : 0),
              name === "revenue" ? "Revenue" : "Expenses",
            ]}
          />
          <Legend
            wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }}
            iconType="circle"
            verticalAlign="top"
            height={20}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-1)"
            fill="url(#revenueGradient)"
            strokeWidth={2.5}
            activeDot={{ r: 4, fill: "var(--chart-1)" }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="var(--chart-7)"
            fill="url(#expenseGradient)"
            strokeWidth={2.2}
            activeDot={{ r: 4, fill: "var(--chart-7)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
