"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="max-w-lg p-6">
      <h2 className="text-xl font-semibold">Terjadi error pada modul ERP</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "Silakan coba ulang."}</p>
      <Button className="mt-4" onClick={() => reset()}>
        Coba Lagi
      </Button>
    </Card>
  );
}
