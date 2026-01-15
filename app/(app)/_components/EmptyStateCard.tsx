"use client";

import * as React from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function EmptyStateCard(props: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const { title, description, actionLabel, onAction, className } = props;

  return (
    <div
      className={cx(
        "rounded-2xl border bg-white/80 backdrop-blur p-6",
        "shadow-[0_18px_60px_rgba(17,20,57,0.06)]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-white">
          {/* simple icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M8 7h8M8 11h8M8 15h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6 3h12a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity="0.55"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[color:var(--fg)]">{title}</div>
          <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">{description}</div>

          {actionLabel && onAction ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onAction}
                className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold
                hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                {actionLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
