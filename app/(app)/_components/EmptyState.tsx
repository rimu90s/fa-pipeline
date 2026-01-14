// app/(app)/_components/EmptyState.tsx
import * as React from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function EmptyState(props: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-xl border bg-white p-6", props.className)}>
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30"
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 7h10M7 12h7M7 17h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{props.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
          {props.action ? <div className="mt-3">{props.action}</div> : null}
        </div>
      </div>
    </div>
  );
}
