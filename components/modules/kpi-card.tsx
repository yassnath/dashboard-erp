import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  tone = "neutral",
  valueTone = "neutral",
  variant = "cyan",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "negative" | "neutral";
  valueTone?: "positive" | "negative" | "neutral";
  variant?: "cyan" | "blue" | "green" | "amber" | "orange" | "violet" | "rose" | "teal";
}) {
  const variantClasses = {
    cyan: "border-[var(--chart-1)]/35",
    blue: "border-[var(--chart-2)]/35",
    green: "border-[var(--chart-3)]/35",
    amber: "border-[var(--chart-4)]/35",
    orange: "border-[var(--chart-5)]/35",
    violet: "border-[var(--chart-6)]/35",
    rose: "border-[var(--chart-7)]/35",
    teal: "border-[var(--chart-8)]/35",
  }[variant];

  const dotClasses = {
    cyan: "bg-[var(--chart-1)]",
    blue: "bg-[var(--chart-2)]",
    green: "bg-[var(--chart-3)]",
    amber: "bg-[var(--chart-4)]",
    orange: "bg-[var(--chart-5)]",
    violet: "bg-[var(--chart-6)]",
    rose: "bg-[var(--chart-7)]",
    teal: "bg-[var(--chart-8)]",
  }[variant];

  const valueToneClass = {
    positive: "text-emerald-500 dark:text-emerald-300",
    negative: "text-red-500 dark:text-red-300",
    neutral: "text-foreground",
  }[valueTone];

  return (
    <Card className={cn("relative overflow-hidden", variantClasses)}>
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl",
          `${dotClasses}/20`,
        )}
      />
      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dotClasses)} />
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold", valueToneClass)}>{value}</p>
      {delta ? (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs">
          {tone === "positive" ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : null}
          {tone === "negative" ? <ArrowDownRight className="h-3 w-3 text-red-400" /> : null}
          <span>{delta}</span>
        </div>
      ) : null}
    </Card>
  );
}

