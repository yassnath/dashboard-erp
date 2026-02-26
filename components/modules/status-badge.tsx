import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  if (["PAID", "APPROVED", "RECEIVED", "DONE", "ACTIVE"].includes(normalized)) {
    return <Badge variant="success">{status.replace("_", " ")}</Badge>;
  }

  if (["REJECTED", "CANCELLED", "ABSENT"].includes(normalized)) {
    return <Badge variant="danger">{status.replace("_", " ")}</Badge>;
  }

  if (["SUBMITTED", "ISSUED", "PENDING", "IN_PROGRESS", "ON_HOLD"].includes(normalized)) {
    return <Badge variant="warning">{status.replace("_", " ")}</Badge>;
  }

  return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
}

