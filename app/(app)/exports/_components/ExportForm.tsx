// app/(app)/exports/_components/ExportForm.tsx
"use client";

import * as React from "react";
import { validateDateRange } from "@/app/(app)/_lib/export";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

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
    "h-11 w-full rounded-xl border bg-white/90 px-4 text-sm " +
    "shadow-[inset_0_1px_0_rgba(17,20,57,0.04)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.28)] focus-visible:ring-offset-2";

  const btnBase =
    "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="export-start-date" className="text-sm font-medium text-[color:var(--fg)]">
            Start date
          </label>
          <input
            id="export-start-date"
            className={cx(inputBase, "border-[color:rgba(17,20,57,0.14)]")}
            type="date"
            value={start_date}
            onChange={(e) => setStart(e.target.value)}
            aria-describedby={helperId}
            aria-invalid={!validation.ok}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="export-end-date" className="text-sm font-medium text-[color:var(--fg)]">
            End date
          </label>
          <input
            id="export-end-date"
            className={cx(inputBase, "border-[color:rgba(17,20,57,0.14)]")}
            type="date"
            value={end_date}
            onChange={(e) => setEnd(e.target.value)}
            aria-describedby={helperId}
            aria-invalid={!validation.ok}
          />
        </div>
      </div>

      <p id={helperId} className="text-xs text-[color:rgba(17,20,57,0.58)]">
        {validation.ok ? "Select a date range to enable download." : validation.helper}
      </p>

      {errorMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2">
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
          className={cx(btnBase, "border border-[color:rgba(17,20,57,0.14)] bg-white/90 hover:bg-white")}
          disabled={disabled || busy}
          onClick={() => onDownload({ start_date, end_date, format: "csv" })}
        >
          {loading?.csv ? "Preparing…" : "Download CSV"}
        </button>

        <button
          type="button"
          className={cx(
            btnBase,
            "text-white shadow-[0_18px_50px_rgba(43,89,255,0.18)]",
            "bg-[linear-gradient(135deg,#111439_0%,#2B59FF_55%,#8B5CF6_100%)] hover:brightness-[1.03] active:brightness-[0.98]"
          )}
          disabled={disabled || busy}
          onClick={() => onDownload({ start_date, end_date, format: "xlsx" })}
        >
          {loading?.xlsx ? "Preparing…" : "Download XLSX"}
        </button>
      </div>
    </div>
  );
}
