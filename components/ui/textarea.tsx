import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-[90px] w-full rounded-2xl border border-border/70 bg-panel/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
