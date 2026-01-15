"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getReportUserContext, type UserRole } from "./_lib/me";
import StatCard from "./_components/StatCard";
import { makeMockData, sumVisits, countLeads, countLeadStatus } from "./_lib/mock-data";
import { SkeletonBlock } from "./_components/Skeleton";
import { EmptyState } from "./_components/EmptyState";

function canInputFromRoles(roles: UserRole[]) {
  return roles.some((r) => r === "FA" || r === "BRANCH_MANAGER" || r === "COMPANY_ADMIN");
}

function canExportFromRoles(roles: UserRole[]) {
  return roles.some(
    (r) => r === "FA" || r === "BRANCH_MANAGER" || r === "COMPANY_ADMIN" || r === "AUDITOR"
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-8 w-24" />
        </div>
        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-8 w-24" />
        </div>
        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-8 w-24" />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[] | null>(null);

  useEffect(() => {
    let alive = true;

    getReportUserContext()
      .then((ctx) => {
        if (!alive) return;

        // If userId empty, we are not authenticated -> go login
        if (!ctx.userId) {
          if (alive) setRoles([]);
          return;
        }

        setRoles(ctx.roles);
      })
      .catch(() => {
        if (!alive) return;
        // Do NOT hard-redirect on transient errors. Avoid login loop.
        setRoles([]);
      });

    return () => {
      alive = false;
    };
  }, [router]);

  const { visits, leads } = useMemo(() => makeMockData(new Date()), []);

  if (roles === null) return <DashboardSkeleton />;

  const canInput = canInputFromRoles(roles);
  const canExport = canExportFromRoles(roles);

  // Mock metrics
  const totalVisits = sumVisits(visits);
  const totalLeads = countLeads(leads);
  const won = countLeadStatus(leads, "WON");
  const conversion = totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">A quick overview for the last 7 days.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Visits (7 days)"
          value={canInput ? `${totalVisits}` : "—"}
          subtitle={canInput ? "Based on recent activity" : "Available for input roles"}
          hint="Preview"
        />
        <StatCard
          title="Leads (7 days)"
          value={canInput ? `${totalLeads}` : "—"}
          subtitle={canInput ? `Won: ${won} · Conversion: ${conversion}%` : "Available for input roles"}
          hint="Preview"
        />
        <StatCard
          title="Exports"
          value={canExport ? "Ready" : "Restricted"}
          subtitle={canExport ? "CSV & Excel downloads" : "Requires export role"}
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold">Quick actions</div>
            <div className="mt-1 text-sm text-muted-foreground">Jump straight to what you need.</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/exports"
              className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-3 text-sm
              hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Exports
            </Link>

            {canInput ? (
              <>
                <Link
                  href="/visit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-black px-3 text-sm text-white
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Create Visit
                </Link>
                <Link
                  href="/daily-leads"
                  className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-3 text-sm
                  hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Daily Leads
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {!canInput ? (
          <div className="mt-4">
            <EmptyState
              title="You’re in view-only mode."
              description="You can review reports and exports, but input actions are restricted for your role."
              action={
                <Link
                  href="/exports"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-black px-3 text-sm text-white
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Go to Exports
                </Link>
              }
            />
          </div>
        ) : null}
      </div>

      {/* Recent activity (mock preview) */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-base font-semibold">Recent activity</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Sample data for UX preview (will be replaced by live data later).
        </div>

        <div className="mt-4 space-y-2">
          {visits
            .slice(-5)
            .reverse()
            .map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">Visit · {v.unit}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.date}
                    {v.notes ? ` · ${v.notes}` : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold">{v.metric}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
