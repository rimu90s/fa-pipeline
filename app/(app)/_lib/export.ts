// app/(app)/_lib/export.ts
export type ExportKind = "visit-daily" | "daily-leads" | "weekly-leads" | "bundle";
export type ExportFormat = "csv" | "xlsx";

export const EXPORT_ENDPOINTS: Record<
  Exclude<ExportKind, "bundle">,
  { csv: string; xlsx: string }
> = {
  "visit-daily": {
    csv: "/api/report/export/visit-daily.csv",
    xlsx: "/api/report/export/visit-daily.xlsx",
  },
  "daily-leads": {
    csv: "/api/report/export/daily-leads-summary.csv",
    xlsx: "/api/report/export/daily-leads-summary.xlsx",
  },
  "weekly-leads": {
    csv: "/api/report/export/weekly-leads-summary.csv",
    xlsx: "/api/report/export/weekly-leads-summary.xlsx",
  },
};

export const BUNDLE_XLSX_ENDPOINT = "/api/report/export/bundle.xlsx";

export function buildExportUrl(args: {
  kind: ExportKind;
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
}) {
  const { kind, format, start_date, end_date } = args;

  const base =
    kind === "bundle"
      ? BUNDLE_XLSX_ENDPOINT
      : EXPORT_ENDPOINTS[kind][format];

  const url = new URL(base, "http://localhost"); // dummy base for URL API

  if (kind !== "bundle") {
    if (start_date) url.searchParams.set("start_date", start_date);
    if (end_date) url.searchParams.set("end_date", end_date);
  }

  return url.pathname + url.search;
}

export function validateDateRange(start_date: string, end_date: string) {
  if (!start_date || !end_date) {
    return { ok: false as const, helper: "Start date and end date are required." };
  }
  if (start_date > end_date) {
    return { ok: false as const, helper: "Start date must be earlier than or equal to end date." };
  }
  return { ok: true as const, helper: "" };
}

export type BackendErrorShape = {
  error?: { code?: string; message?: string };
};

export async function readBackendErrorMessage(res: Response) {
  try {
    const data = (await res.json()) as BackendErrorShape;
    return data?.error?.message || res.statusText || "Unknown error";
  } catch {
    return res.statusText || "Unknown error";
  }
}
