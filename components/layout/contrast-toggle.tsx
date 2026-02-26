"use client";

import { Contrast } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

export function ContrastToggle() {
  const highContrast = useUiStore((state) => state.highContrast);
  const toggleHighContrast = useUiStore((state) => state.toggleHighContrast);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle high contrast"
      onClick={toggleHighContrast}
      className={highContrast ? "border-[var(--accent)]" : undefined}
    >
      <Contrast className="h-4 w-4" />
    </Button>
  );
}
