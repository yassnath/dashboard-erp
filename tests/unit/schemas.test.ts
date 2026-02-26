import { expect, test } from "vitest";

import { journalEntrySchema, purchaseRequestSchema } from "../../lib/schemas";

test("journal schema rejects unbalanced lines", () => {
  const parsed = journalEntrySchema.safeParse({
    description: "Unbalanced",
    date: "2026-02-26",
    lines: [
      { accountName: "Cash", debit: 100000, credit: 0 },
      { accountName: "Revenue", debit: 0, credit: 90000 },
    ],
  });

  expect(parsed.success).toBe(false);
});

test("purchase request schema accepts valid payload", () => {
  const parsed = purchaseRequestSchema.safeParse({
    supplierId: "ckaaaaaaaaaaaaaaaaaaaaaaa",
    note: "Restock beans",
    items: [
      {
        productId: "ckbbbbbbbbbbbbbbbbbbbbbbb",
        quantity: 5,
        unitCost: 100000,
      },
    ],
  });

  expect(parsed.success).toBe(true);
});
