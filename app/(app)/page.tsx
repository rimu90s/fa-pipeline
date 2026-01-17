// app/(app)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getReportUserContext, type UserRole } from "./_lib/me";
import StatCard from "./_components/StatCard";
import { makeMockData, sumVisits, countLeads, countLeadStatus } from "./_lib/mock-data";
import { SkeletonBlock } from "./_components/Skeleton";
import { EmptyState } from "./_components/EmptyState";

type VisitRow = {
  id: string;
  unit: string;
  date: string;
  metric: number;
  notes?: string;
};

type ActivityItem = {
  id: string;
  title: string;
  date: string;
  note?: string;
  metric: number;
  status: "FOLLOW_UP" | "LOGGED";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function canInputFromRoles(roles: UserRole[]) {
  return roles.some((r) => r === "FA" || r === "BRANCH_MANAGER" || r === "COMPANY_ADMIN");
}

function canExportFromRoles(roles: UserRole[]) {
  return roles.some((r) => r === "FA" || r === "BRANCH_MANAGER" || r === "COMPANY_ADMIN" || r === "AUDITOR");
}

function pctChange(curr: number, prev: number) {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill">{children}</span>;
}

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 4.6L18 8l-4.8 1.4L12 14l-1.2-4.6L6 8l4.8-1.4L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h3l2-7 4 14 2-7h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-4 w-80" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-8 w-24" />
              <SkeletonBlock className="h-3 w-44" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel">
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel">
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-[color:var(--fg)]">{title}</div>
          {subtitle ? <div className="mt-1 text-sm leading-6 text-muted">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="relative z-10 mt-4">{children}</div>
    </section>
  );
}

function InsightMiniCard({
  title,
  description,
  accent,
  icon,
  actions,
  footer,
}: {
  title: string;
  description: React.ReactNode;
  accent: "blue" | "purple" | "emerald" | "neutral";
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const border =
    accent === "blue"
      ? "rgba(59,130,246,0.14)"
      : accent === "purple"
        ? "rgba(139,92,246,0.14)"
        : accent === "emerald"
          ? "rgba(16,185,129,0.14)"
          : "rgba(17,20,57,0.12)";

  const rail =
    accent === "blue"
      ? "rgba(59,130,246,0.55)"
      : accent === "purple"
        ? "rgba(139,92,246,0.55)"
        : accent === "emerald"
          ? "rgba(16,185,129,0.55)"
          : "rgba(17,20,57,0.28)";

  return (
    <div className="glass-card glass-hover relative p-4" style={{ borderColor: border }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
        style={{ background: `linear-gradient(180deg, ${rail}, rgba(255,255,255,0))`, opacity: 0.55 }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--line)] bg-white/60 backdrop-blur-xl text-[color:rgba(17,20,57,0.72)]">
              {icon}
            </span>
          ) : null}
          <div className="text-sm font-semibold text-[color:var(--fg)]">{title}</div>
        </div>

        <div className="mt-2 text-sm leading-6 text-muted">{description}</div>

        {actions ? <div className="mt-3 flex gap-2">{actions}</div> : null}
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[] | null>(null);

  function prefetch(href: string) {
    try {
      router.prefetch(href);
    } catch {}
  }

  useEffect(() => {
    let alive = true;

    getReportUserContext()
      .then((ctx: { userId: string; roles: UserRole[] }) => {
        if (!alive) return;
        if (!ctx.userId) {
          setRoles([]);
          return;
        }
        setRoles(ctx.roles);
      })
      .catch(() => {
        if (!alive) return;
        setRoles([]);
      });

    return () => {
      alive = false;
    };
  }, [router]);

  const { visits, leads } = useMemo(() => makeMockData(new Date()), []);
  const { visits: prevVisits, leads: prevLeads } = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return makeMockData(d);
  }, []);

  const visitsTyped = visits as unknown as VisitRow[];
  const prevVisitsTyped = prevVisits as unknown as VisitRow[];

  const totalVisits = sumVisits(visitsTyped);
  const totalLeads = countLeads(leads);
  const won = countLeadStatus(leads, "WON");
  const conversion = totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0;

  const prevTotalVisits = sumVisits(prevVisitsTyped);
  const prevTotalLeads = countLeads(prevLeads);
  const prevWon = countLeadStatus(prevLeads, "WON");
  const prevConversion = prevTotalLeads > 0 ? Math.round((prevWon / prevTotalLeads) * 100) : 0;

  const visitsDelta = pctChange(totalVisits, prevTotalVisits);
  const leadsDelta = pctChange(totalLeads, prevTotalLeads);
  const convDelta = pctChange(conversion, prevConversion);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const hasTodayVisit = visitsTyped.some((v) => v.date === todayISO);

  const activity: ActivityItem[] = useMemo(() => {
    return visitsTyped
      .slice(-8)
      .reverse()
      .map((v) => ({
        id: v.id,
        title: `Visit · ${v.unit}`,
        date: v.date,
        note: v.notes,
        metric: v.metric,
        status: (v.notes ? "FOLLOW_UP" : "LOGGED") as ActivityItem["status"],
      }))
      .slice(0, 6);
  }, [visitsTyped]);

  if (roles === null) return <DashboardSkeleton />;

  const canInput = canInputFromRoles(roles);
  const canExport = canExportFromRoles(roles);

  const btnBase =
    "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold " +
    "transition-[transform,box-shadow,filter] duration-200 will-change-transform " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(99,102,241,0.22)] focus-visible:ring-offset-2";

  const btnSecondary =
    "border border-[rgba(17,20,57,0.12)] bg-white/60 backdrop-blur-xl text-[color:rgba(17,20,57,0.78)] " +
    "hover:bg-white/75 hover:shadow-[0_14px_44px_rgba(17,20,57,0.10)] active:translate-y-[1px]";

  const btnHero =
    "border border-[rgba(79,70,229,0.18)] bg-white/65 backdrop-blur-xl " +
  "text-[color:rgba(17,20,57,0.86)] " +
  "shadow-[0_18px_60px_rgba(79,70,229,0.12)] " +
  "hover:bg-white/75 hover:shadow-[0_26px_90px_rgba(79,70,229,0.14)] " +
  "active:translate-y-[1px]";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">Dashboard</h1>
            <p className="mt-1 text-sm leading-6 text-muted">
              Overview 7 hari terakhir. Insights membandingkan periode sebelumnya.
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(17,20,57,0.00), rgba(99,102,241,0.20), rgba(59,130,246,0.14), rgba(17,20,57,0.00))",
          }}
        />
      </div>

      <Panel
        title="Insights"
        subtitle="7 hari terakhir vs 7 hari sebelumnya."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Visits — {visitsDelta}%</Pill>
            <Pill>Leads — {leadsDelta}%</Pill>
            <Pill>Conversion — {convDelta}%</Pill>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <InsightMiniCard
            title="Today"
            accent="blue"
            icon={<IconSpark />}
            description={
              canInput ? (
                hasTodayVisit ? (
                  <>Input visit hari ini sudah tercatat.</>
                ) : (
                  <>Belum ada input visit hari ini.</>
                )
              ) : (
                <>Mode view-only.</>
              )
            }
            actions={
              <>
                <Link
                  href="/visit"
                  onMouseEnter={() => prefetch("/visit")}
                  className={cx(btnBase, "h-9 px-3", btnSecondary)}
                >
                  Go Visit
                </Link>
                <Link
                  href="/daily-leads"
                  onMouseEnter={() => prefetch("/daily-leads")}
                  className={cx(btnBase, "h-9 px-3", btnSecondary)}
                >
                  Daily Leads
                </Link>
              </>
            }
          />

          <InsightMiniCard
            title="Export readiness"
            accent="purple"
            description={canExport ? <>Exports siap dan tercatat untuk audit.</> : <>Export dibatasi untuk role tertentu.</>}
            actions={
              <Link
                href="/exports"
                onMouseEnter={() => prefetch("/exports")}
                className={cx(btnBase, "h-9 px-3", btnSecondary)}
              >
                Open Exports
              </Link>
            }
          />

          <InsightMiniCard
            title="Quality"
            accent="emerald"
            description={
              <>
                Conversion {conversion >= prevConversion ? "stabil/naik" : "turun"}. Pertahankan follow-up.
              </>
            }
            footer={
              <div className="flex gap-2">
                <Pill>Now {conversion}%</Pill>
                <Pill>Prev {prevConversion}%</Pill>
              </div>
            }
          />
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Visits (7 days)"
          value={canInput ? `${totalVisits}` : "—"}
          subtitle={canInput ? "Recent activity aggregate" : "Available for input roles"}
          hint="Preview"
          tone="blue"
        />
        <StatCard
          title="Leads (7 days)"
          value={canInput ? `${totalLeads}` : "—"}
          subtitle={canInput ? `Won ${won} · Conversion ${conversion}%` : "Available for input roles"}
          hint="Preview"
          tone="purple"
        />
        <StatCard
          title="Exports"
          value={canExport ? "Ready" : "Restricted"}
          subtitle={canExport ? "CSV & Excel downloads" : "Requires export role"}
          tone="emerald"
        />
      </div>

      <Panel
        title="Quick actions"
        subtitle="Akses cepat ke halaman utama."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/exports" onMouseEnter={() => prefetch("/exports")} className={cx(btnBase, btnSecondary)}>
              Exports
            </Link>
            {canInput ? (
              <>
                <Link
                  href="/daily-leads"
                  onMouseEnter={() => prefetch("/daily-leads")}
                  className={cx(btnBase, btnSecondary)}
                >
                  Daily Leads
                </Link>
                <Link href="/visit" onMouseEnter={() => prefetch("/visit")} className={cx(btnBase, "h-10 px-5", btnHero)}>
                  Create Visit
                </Link>
              </>
            ) : null}
          </div>
        }
      >
        {!canInput ? (
          <EmptyState
            title="View-only mode"
            description="Input dibatasi untuk role kamu. Kamu tetap bisa melihat report dan export."
            action={
              <Link href="/exports" onMouseEnter={() => prefetch("/exports")} className={cx(btnBase, "h-10 px-5", btnHero)}>
                Go to Exports
              </Link>
            }
          />
        ) : (
          <div className="text-sm leading-6 text-muted">
            Tip: gunakan <span className="font-semibold text-[color:var(--fg)]">Exports</span> untuk unduhan yang audit-ready.
          </div>
        )}
      </Panel>

      <Panel
        title="Recent activity"
        subtitle="Preview aktivitas. Nanti akan berasal dari data live."
        right={
          <Link href="/visit" onMouseEnter={() => prefetch("/visit")} className={cx(btnBase, "h-9 px-3", btnSecondary)}>
            View all →
          </Link>
        }
      >
        <div className="grid gap-2">
          {activity.map((a) => (
            <div key={a.id} className="glass-card glass-hover px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--line)] bg-white/60 backdrop-blur-xl text-[color:rgba(17,20,57,0.72)]">
                    <IconActivity />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{a.title}</div>
                      <Pill>{a.status === "FOLLOW_UP" ? "Follow-up" : "Logged"}</Pill>
                    </div>

                    <div className="mt-0.5 text-xs leading-5 text-[color:rgba(17,20,57,0.58)]">
                      {a.date}
                      {a.note ? ` · ${a.note}` : ""}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <Pill>{a.metric}</Pill>
                </div>
              </div>
            </div>
          ))}

          {activity.length === 0 ? (
            <div className="glass-card p-4">
              <div className="text-sm font-semibold text-[color:var(--fg)]">No activity yet</div>
              <div className="mt-1 text-sm leading-6 text-muted">Aktivitas akan muncul setelah ada input data.</div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
