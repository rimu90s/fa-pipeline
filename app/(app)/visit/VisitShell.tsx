"use client";

import * as React from "react";
import { EmptyStateCard } from "@/app/(app)/_components/EmptyStateCard";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function countTableRows(root: HTMLElement | null) {
  if (!root) return null;
  const table = root.querySelector("table");
  if (!table) return null;
  const tbody = table.querySelector("tbody");
  if (!tbody) return 0;
  return tbody.querySelectorAll("tr").length;
}

export function VisitShell({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // initial
    setRows(countTableRows(el));

    // observe future changes
    const obs = new MutationObserver(() => {
      setRows(countTableRows(el));
    });

    obs.observe(el, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  const showEmpty = rows === 0;

  function scrollToForm() {
    const el = ref.current;
    if (!el) return;

    const target =
      el.querySelector("form") ||
      el.querySelector("input") ||
      el.querySelector("textarea") ||
      el;

    (target as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6" ref={ref}>
      {/* Page header */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold text-[color:var(--fg)]">Visit</div>
            <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
              Input visit event dan pantau histori kunjungan per unit kerja.
              <span className="hidden md:inline">
                {" "}
                Jika tabel kosong, artinya belum ada data pada rentang tanggal tersebut.
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border bg-white px-3 py-1 text-xs font-semibold text-[color:rgba(17,20,57,0.70)]">
            Audit-ready
          </div>
        </div>
      </div>

      {/* Empty state (only when table exists & has 0 rows) */}
      {showEmpty ? (
        <EmptyStateCard
          title="Belum ada data di rentang tanggal ini"
          description="Silakan isi form Visit Event di bawah. Setelah submit, data akan muncul di tabel histori."
          actionLabel="Scroll ke Form"
          onAction={scrollToForm}
        />
      ) : null}

      {/* Report content framed */}
      <div
        className={cx(
          "rounded-2xl border bg-white/70 backdrop-blur",
          "shadow-[0_18px_70px_rgba(17,20,57,0.06)]"
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export default VisitShell;
