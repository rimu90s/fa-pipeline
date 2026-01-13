export default function ExportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Exports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download report files (view-only).
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 space-y-2">
        <a className="block text-sm underline" href="/api/report/export/visit-daily.xlsx">
          Visit Daily (XLSX)
        </a>
        <a className="block text-sm underline" href="/api/report/export/visit-daily.csv">
          Visit Daily (CSV)
        </a>
        <a className="block text-sm underline" href="/api/report/export/daily-leads-summary.xlsx">
          Daily Leads Summary (XLSX)
        </a>
        <a className="block text-sm underline" href="/api/report/export/daily-leads-summary.csv">
          Daily Leads Summary (CSV)
        </a>
        <a className="block text-sm underline" href="/api/report/export/weekly-leads-summary.xlsx">
          Weekly Leads Summary (XLSX)
        </a>
        <a className="block text-sm underline" href="/api/report/export/weekly-leads-summary.csv">
          Weekly Leads Summary (CSV)
        </a>
      </div>
    </div>
  );
}
