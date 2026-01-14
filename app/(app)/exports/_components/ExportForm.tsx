// app/(app)/exports/_components/ExportForm.tsx
"use client";

import * as React from "react";
import { validateDateRange } from "@/app/(app)/_lib/export";

export function ExportForm(props: {
  onDownload: (args: { start_date: string; end_date: string; format: "csv" | "xlsx" }) => Promise<void>;
  loading?: { csv?: boolean; xlsx?: boolean };
  errorMessage?: string;
}) {
  const { onDownload, loading, errorMessage } = props;

  const [start_date, setStart] = React.useState("");
  const [end_date, setEnd] = React.useState("");

  const validation = validateDateRange(start_date, end_date);
  const disabled = !validation.ok;
  const busy = !!loading?.csv || !!loading?.xlsx;

  const helperId = "export-date-helper";

  const inputBase =
    "h-10 w-full rounded-md border bg-white px-3 text-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  const btnBase =
    "inline-flex h-10 items-center justify-center rounded-md px-3 text-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="export-start-date" className="text-sm font-medium">
            Start date
          </label>
          <input
            id="export-start-date"
            className={inputBase}
            type="date"
            value={start_date}
            onChange={(e) => setStart(e.target.value)}
            aria-describedby={helperId}
            aria-invalid={!validation.ok}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="export-end-date" className="text-sm font-medium">
            End date
          </label>
          <input
            id="export-end-date"
            className={inputBase}
            type="date"
            value={end_date}
            onChange={(e) => setEnd(e.target.value)}
            aria-describedby={helperId}
            aria-invalid={!validation.ok}
          />
        </div>
      </div>

      {!validation.ok ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {validation.helper}
        </p>
      ) : (
        <p id={helperId} className="text-xs text-muted-foreground">
          Select a date range to enable download.
        </p>
      )}

      {/* Keep error message as-is (backend truth); styling only */}
      {errorMessage ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-0.5 text-amber-800">
              ⚠️
            </span>
            <p className="text-sm text-amber-900">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btnBase} border bg-white`}
          disabled={disabled || busy}
          onClick={() => onDownload({ start_date, end_date, format: "csv" })}
        >
          {loading?.csv ? "Preparing…" : "Download CSV"}
        </button>

        <button
          type="button"
          className={`${btnBase} bg-black text-white`}
          disabled={disabled || busy}
          onClick={() => onDownload({ start_date, end_date, format: "xlsx" })}
        >
          {loading?.xlsx ? "Preparing…" : "Download XLSX"}
        </button>
      </div>
    </div>
  );
}
