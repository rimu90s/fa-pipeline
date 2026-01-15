// app/(app)/visit/error.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // optional: console for debugging
    console.error(error);
  }, [error]);

  const unauth = String(error?.message || "").toUpperCase().includes("UNAUTHENTICATED");

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-lg font-semibold">
        {unauth ? "Session expired" : "Something went wrong"}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {unauth
          ? "Please sign in again to continue."
          : "Try again, or go back to the dashboard."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {unauth ? (
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white"
          >
            Go to Login
          </Link>
        ) : (
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white"
          >
            Try again
          </button>
        )}

        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
