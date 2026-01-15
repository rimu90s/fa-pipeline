// app/(app)/_components/StatCard.tsx
type Props = {
  title: string;
  value: string;
  subtitle?: string;
  hint?: string;
};

export default function StatCard({ title, value, subtitle, hint }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>

        {hint ? (
          <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
