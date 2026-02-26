import { Prisma } from "@prisma/client";

export function decimal(value: number) {
  return new Prisma.Decimal(value);
}

export function asNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (value instanceof Prisma.Decimal) return Number(value.toString());
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
