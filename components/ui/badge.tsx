import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent)]",
        secondary: "border-border/80 bg-panel/70 text-foreground",
        success:
          "border-emerald-600/55 bg-emerald-100/85 text-emerald-950 dark:border-emerald-300/55 dark:bg-emerald-400/18 dark:text-emerald-100",
        warning: "border-amber-500/50 bg-amber-500/18 text-amber-900 dark:border-amber-300/60 dark:bg-amber-400/20 dark:text-amber-100",
        danger: "border-red-500/45 bg-red-500/15 text-red-800 dark:border-red-300/60 dark:bg-red-400/15 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
