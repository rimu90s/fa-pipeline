// app/(app)/exports/_components/ExportCard.tsx
"use client";

import * as React from "react";
import {
  buildExportUrl,
  readBackendErrorMessage,
  ExportKind,
} from "@/app/(app)/_lib/export";
import { useAutoDismissMessage } from "@/app/(app)/_lib/ui-state";
import { InlineFeedback } from "@/app/(app)/_components/InlineFeedback";
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

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ExportCard(props: Props) {
  const [loading, setLoading] = React.useState<{ csv?: boolean; xlsx?: boolean }>({});
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const feedback = useAutoDismissMessage(2500);

  async function preflightAndDownload(url: string, format: "csv" | "xlsx") {
    setErrorMessage("");
    feedback.clear();
    setLoading((s) => ({ ...s, [format]: true }));

    try {
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const msg = await readBackendErrorMessage(res);
        setErrorMessage(msg);
        feedback.showError(msg);
        return;
      }

      feedback.showSuccess("Export started. Your download will begin shortly.");
      window.location.href = url;
    } catch {
      const msg = "Network error";
      setErrorMessage(msg);
      feedback.showError(msg);
    } finally {
      setLoading((s) => ({ ...s, [format]: false }));
    }
  }

  const cardCls =
    "rounded-2xl border bg-white p-6 shadow-[0_18px_60px_rgba(17,20,57,0.08)]";

  const btnBase =
    "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  if (props.kind === "bundle") {
    const url = buildExportUrl({ kind: "bundle", format: "xlsx" });

    return (
      <div className={cardCls}>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[color:var(--fg)]">{props.title}</h2>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>

        <div className="mt-4 space-y-3">
          <InlineFeedback kind={feedback.kind} message={feedback.message} />

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

          <button
            type="button"
            className={cx(
              btnBase,
              "text-white shadow-[0_18px_50px_rgba(43,89,255,0.18)]",
              "bg-[linear-gradient(135deg,#111439_0%,#2B59FF_55%,#8B5CF6_100%)] hover:brightness-[1.03] active:brightness-[0.98]"
            )}
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
    <div className={cardCls}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[color:var(--fg)]">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4 space-y-3">
        <InlineFeedback kind={feedback.kind} message={feedback.message} />
        <ExportForm onDownload={onDownload} loading={loading} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
