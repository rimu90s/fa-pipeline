function needsQuoting(s: string) {
  return /[",\n\r]/.test(s);
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (!needsQuoting(s)) return s;
  // RFC 4180 style: double quotes are escaped by doubling them
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: string[]): string {
  const header = columns.map(csvEscape).join(",");
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n") + "\n";
}

export function csvFileName(prefix: string, start: string, end: string) {
  // start/end are ISO date only (YYYY-MM-DD). Convert to YYYYMMDD.
  const s = start.replaceAll("-", "");
  const e = end.replaceAll("-", "");
  return `${prefix}_${s}-${e}.csv`;
}
