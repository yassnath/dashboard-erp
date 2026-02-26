import { expect, test } from "vitest";

import { formatCurrency, formatDate } from "../../lib/format";

test("formats IDR currency", () => {
  expect(formatCurrency(1500000)).toBe("Rp\u00a01.500.000");
});

test("formats Indonesian date", () => {
  expect(formatDate("2026-02-26T00:00:00.000Z")).toContain("26");
  expect(formatDate("2026-02-26T00:00:00.000Z")).toContain("Feb");
});
