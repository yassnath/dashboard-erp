import { Inbox } from "lucide-react";

import { Card } from "@/components/ui/card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-10 text-center">
      <Inbox className="mb-3 h-7 w-7 text-[var(--accent)]" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

