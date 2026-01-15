// app/(app)/exports/_components/ExportHistoryNote.tsx
export function ExportHistoryNote() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-[0_18px_60px_rgba(17,20,57,0.08)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white"
        >
          🧾
        </span>
        <div className="min-w-0">
          <div className="text-base font-semibold text-[color:var(--fg)]">Audit log</div>
          <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
            All exports are logged for audit and compliance purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
