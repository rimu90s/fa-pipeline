// app/(app)/_components/Skeleton.tsx
import * as React from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SkeletonBlock(props: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      aria-label={props["aria-label"] ?? "Loading"}
      className={cx(
        "animate-pulse rounded-md bg-muted/60",
        props.className
      )}
    />
  );
}

export function SkeletonText(props: { lines?: number }) {
  const lines = Math.max(1, props.lines ?? 3);
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cx("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <SkeletonBlock className="h-5 w-40" />
      <SkeletonText lines={2} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-10 w-32" />
        <SkeletonBlock className="h-10 w-32" />
      </div>
    </div>
  );
}

export function SkeletonTable(props: { rows?: number; cols?: number }) {
  const rows = Math.max(3, props.rows ?? 6);
  const cols = Math.max(3, props.cols ?? 5);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={`h-${i}`} className="h-4 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={`r-${r}`}
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: cols }).map((__, c) => (
                <SkeletonBlock key={`c-${r}-${c}`} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
