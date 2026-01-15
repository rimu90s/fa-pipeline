// app/(app)/exports/_components/ExportPage.tsx
import { ExportCard } from "./ExportCard";
import { ExportHistoryNote } from "./ExportHistoryNote";

function PageShell(props: {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
            {props.title}
          </h1>
          {props.badge ? (
            <span className="hidden md:inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium text-[color:rgba(17,20,57,0.70)]">
              {props.badge}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-[color:rgba(17,20,57,0.62)]">{props.subtitle}</p>
      </div>

      <div className="mt-6">{props.children}</div>
    </div>
  );
}

function EmptyState(props: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-[0_18px_60px_rgba(17,20,57,0.08)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white"
        >
          🔒
        </span>
        <div className="min-w-0">
          <div className="text-base font-semibold text-[color:var(--fg)]">{props.title}</div>
          <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">{props.description}</div>
        </div>
      </div>
    </div>
  );
}

function ExportSkin() {
  // “Skin” khusus exports agar card/form/table terlihat enterprise.
  return (
    <style>{`
      .export-skin :where(.text-muted-foreground){
        color: rgba(17,20,57,0.62) !important;
      }

      /* Card */
      .export-skin :where(.rounded-xl.border.bg-white){
        border-radius: 16px !important;
        border-color: rgba(17,20,57,0.12) !important;
        box-shadow: 0 18px 60px rgba(17,20,57,0.08);
      }

      /* Input date */
      .export-skin :where(input[type="date"], input[type="text"]){
        height: 44px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(17,20,57,0.14) !important;
        background: rgba(255,255,255,0.92) !important;
        box-shadow: inset 0 1px 0 rgba(17,20,57,0.04) !important;
        transition: box-shadow .15s ease, border-color .15s ease;
      }
      .export-skin :where(input[type="date"]:focus, input[type="text"]:focus){
        outline: none !important;
        border-color: rgba(43,89,255,0.42) !important;
        box-shadow: 0 0 0 4px rgba(43,89,255,0.16) !important;
      }

      /* Buttons */
      .export-skin :where(button){
        border-radius: 12px !important;
        height: 44px !important;
        font-weight: 700 !important;
      }
      .export-skin :where(button.bg-black.text-white){
        background: linear-gradient(135deg,#111439 0%, #2B59FF 55%, #8B5CF6 100%) !important;
        border: 1px solid rgba(17,20,57,0.10) !important;
        box-shadow: 0 18px 50px rgba(43,89,255,0.18) !important;
      }
      .export-skin :where(button.border.bg-white){
        border: 1px solid rgba(17,20,57,0.14) !important;
        background: rgba(255,255,255,0.92) !important;
      }
    `}</style>
  );
}

export function ExportPage(props: { canExport: boolean; roles: string[] }) {
  const { canExport, roles } = props;

  return (
    <PageShell
      title="Exports"
      subtitle="Download laporan dalam format CSV atau Excel (audit-ready)."
      badge={canExport ? "Export enabled" : "Restricted"}
    >
      <ExportSkin />

      {!canExport ? (
        <EmptyState
          title="You don’t have access to export."
          description={`Peran Anda saat ini: ${roles.length ? roles.join(", ") : "—"}. Hubungi admin untuk akses export.`}
        />
      ) : (
        <div className="export-skin space-y-5">
          {/* Top info */}
          <div className="rounded-2xl border bg-white p-5 shadow-[0_18px_60px_rgba(17,20,57,0.08)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-base font-semibold text-[color:var(--fg)]">
                  Export center
                </div>
                <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                  Pilih rentang tanggal, lalu unduh. Semua export dicatat untuk audit.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs text-[color:rgba(17,20,57,0.70)]">
                  CSV + XLSX
                </span>
                <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs text-[color:rgba(17,20,57,0.70)]">
                  Role-based
                </span>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ExportCard
              kind="visit-daily"
              title="Visit Daily"
              description="Daily visit events within a selected date range."
              allowCsv
              allowXlsx
            />
            <ExportCard
              kind="daily-leads"
              title="Daily Leads Summary"
              description="Daily leads summary aggregated per day within a selected date range."
              allowCsv
              allowXlsx
            />
            <ExportCard
              kind="weekly-leads"
              title="Weekly Leads Summary"
              description="Weekly leads summary aggregated per week within a selected date range."
              allowCsv
              allowXlsx
            />
            <ExportCard
              kind="bundle"
              title="Bundle (All Reports)"
              description="Download all available reports in a single Excel bundle."
              allowXlsx
            />
          </div>

          <ExportHistoryNote />
        </div>
      )}
    </PageShell>
  );
}
