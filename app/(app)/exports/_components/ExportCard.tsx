// app/(app)/exports/_components/ExportCard.tsx
"use client";

import * as React from "react";
import {
  buildExportUrl,
  readBackendErrorMessage,
  ExportKind,
} from "@/app/(app)/_lib/export";
import { ExportForm } from "./ExportForm";

type Props =
  | {
      kind: "visit-daily" | "daily-leads" | "weekly-leads";
      title: string;
      description: string;
      allowCsv?: boolean;
      allowXlsx?: boolean;
    }
  | {
      kind: "bundle";
      title: string;
      description: string;
      allowXlsx?: boolean;
    };

export function ExportCard(props: Props) {
  const [loading, setLoading] = React.useState<{ csv?: boolean; xlsx?: boolean }>({});
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  async function preflightAndDownload(url: string, format: "csv" | "xlsx") {
    setErrorMessage("");
    setLoading((s) => ({ ...s, [format]: true }));

    try {
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const msg = await readBackendErrorMessage(res);
        setErrorMessage(msg);
        return;
      }

      window.location.href = url;
    } catch {
      setErrorMessage("Network error");
    } finally {
      setLoading((s) => ({ ...s, [format]: false }));
    }
  }

  if (props.kind === "bundle") {
    const url = buildExportUrl({ kind: "bundle", format: "xlsx" });

    return (
      <div className="rounded-xl border bg-white p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{props.title}</h2>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>

        <div className="mt-4 space-y-3">
          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm">{errorMessage}</p>
            </div>
          ) : null}

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-black px-3 text-sm text-white disabled:opacity-50"
            disabled={!!loading.xlsx}
            onClick={() => preflightAndDownload(url, "xlsx")}
          >
            {loading.xlsx ? "Preparing…" : "Download XLSX"}
          </button>
        </div>
      </div>
    );
  }

  const { kind, title, description } = props;

  async function onDownload(args: { start_date: string; end_date: string; format: "csv" | "xlsx" }) {
    const url = buildExportUrl({
      kind: kind as ExportKind,
      format: args.format,
      start_date: args.start_date,
      end_date: args.end_date,
    });

    await preflightAndDownload(url, args.format);
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4">
        <ExportForm onDownload={onDownload} loading={loading} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
