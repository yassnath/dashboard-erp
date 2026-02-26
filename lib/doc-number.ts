export function nextDocNumber(prefix: string, count: number, date = new Date()) {
  const year = date.getFullYear();
  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${sequence}`;
}
