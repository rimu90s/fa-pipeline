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

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Start date</label>
          <input
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            type="date"
            value={start_date}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">End date</label>
          <input
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            type="date"
            value={end_date}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      {!validation.ok ? (
        <p className="text-xs text-muted-foreground">{validation.helper}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Select a date range to enable download.</p>
      )}

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm">{errorMessage}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-3 text-sm disabled:opacity-50"
          disabled={disabled || busy}
          onClick={() => onDownload({ start_date, end_date, format: "csv" })}
        >
          {loading?.csv ? "Preparing…" : "Download CSV"}
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-md bg-black px-3 text-sm text-white disabled:opacity-50"
          disabled={disabled || busy}
          onClick={() => onDownload({ start_date, end_date, format: "xlsx" })}
        >
          {loading?.xlsx ? "Preparing…" : "Download XLSX"}
        </button>
      </div>
    </div>
  );
}
