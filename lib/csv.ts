function sanitize(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const lines = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return "";
        }
        return sanitize(String(value));
      })
      .join(","),
  );

  return [headerLine, ...lines].join("\n");
}
