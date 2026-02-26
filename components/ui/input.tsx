import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-2xl border border-border/70 bg-panel/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
