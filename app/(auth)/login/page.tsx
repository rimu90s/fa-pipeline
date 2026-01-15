import { Suspense } from "react";
import LoginClient from "./LoginClient";

function LoginSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        {/* Brand panel skeleton */}
        <div className="hidden md:block">
          <div className="space-y-4">
            <div className="h-10 w-52 animate-pulse rounded bg-muted/60" />
            <div className="h-5 w-80 animate-pulse rounded bg-muted/60" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted/60" />
          </div>
          <div className="mt-10 rounded-2xl border bg-white p-6">
            <div className="h-4 w-40 animate-pulse rounded bg-muted/60" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted/60" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted/60" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/60" />
            </div>
          </div>
        </div>

        {/* Form card skeleton */}
        <div className="w-full">
          <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-6">
            <div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
            <div className="mt-2 h-4 w-60 animate-pulse rounded bg-muted/60" />
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-16 animate-pulse rounded bg-muted/60" />
                <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted/60" />
                <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
              </div>
              <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
              <div className="flex justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}
