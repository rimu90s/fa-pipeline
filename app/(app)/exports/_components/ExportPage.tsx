// app/(app)/exports/_components/ExportPage.tsx
import { ExportCard } from "./ExportCard";
import { ExportHistoryNote } from "./ExportHistoryNote";

export function ExportPage(props: { canExport: boolean; roles: string[] }) {
  const { canExport } = props;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Exports</h1>
        <p className="text-sm text-muted-foreground">
          Download reports in CSV or Excel format
        </p>
      </div>

      {!canExport ? (
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm">You do not have permission to export reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
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

          <ExportHistoryNote />
        </div>
      )}
    </div>
  );
}
