"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { filterNavByRole, NAV_ITEMS } from "../_lib/nav";
import { getReportUserContext, type UserRole } from "../_lib/me";

type SidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function MenuSkeleton() {
  return (
    <div className="px-3 pb-6">
      <div className="space-y-3">
        <div className="h-9 w-full animate-pulse rounded-xl bg-[rgba(17,20,57,0.06)]" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-[rgba(17,20,57,0.06)]" />
        <div className="h-9 w-5/6 animate-pulse rounded-xl bg-[rgba(17,20,57,0.06)]" />
      </div>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  // simple inline icon set (no dependency)
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const };
  switch (name) {
    case "Dashboard":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 13h8V4H4v9Zm0 7h8v-5H4v5Zm10 0h6V11h-6v9Zm0-18v7h6V2h-6Z" fill="currentColor" opacity="0.9" />
        </svg>
      );
    case "Visit":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" fill="currentColor" opacity="0.9" />
        </svg>
      );
    case "Daily Leads":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth="2" />
          <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "Exports":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 9l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "Settings":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6H9.1l-.4 2.6a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 13a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1l.4 2.6h5.8l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            opacity="0.85"
          />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function roleBadge(roles: UserRole[] | null) {
  if (!roles) return "Loading…";
  if (!roles.length) return "No role";
  if (roles.includes("COMPANY_ADMIN")) return "Company Admin";
  if (roles.includes("BRANCH_MANAGER")) return "Branch Manager";
  if (roles.includes("AUDITOR")) return "Auditor";
  if (roles.includes("FA")) return "FA";
  return roles[0];
}

export default function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [roles, setRoles] = useState<UserRole[] | null>(null);

  useEffect(() => {
    let alive = true;
    getReportUserContext()
      .then((ctx) => {
        if (alive) setRoles(ctx.roles);
      })
      .catch(() => {
        if (alive) setRoles([]); // fallback UI; auth redirect handled elsewhere
      });
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(() => {
    return roles ? filterNavByRole(NAV_ITEMS, roles) : [];
  }, [roles]);

  const isMobile = variant === "mobile";

  return (
    <aside
      className={cx(
        "min-h-dvh border-r",
        isMobile
          ? "w-full bg-white/70 backdrop-blur-xl"
          : "hidden w-72 bg-white/70 backdrop-blur-xl md:block",
        "border-[rgba(17,20,57,0.10)]"
      )}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2">
              <span
                className="h-9 w-9 rounded-2xl border border-[rgba(17,20,57,0.12)] bg-white/80 shadow-[0_12px_40px_rgba(17,20,57,0.08)]"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(43,89,255,0.22), rgba(255,255,255,0) 62%)",
                }}
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-[color:var(--fg)]">FA Pipeline</div>
                <div className="text-xs text-[color:rgba(17,20,57,0.58)]">Operations</div>
              </div>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-[rgba(17,20,57,0.12)] bg-white/80 px-3 py-1 text-[11px] font-medium text-[color:rgba(17,20,57,0.70)]">
            {roleBadge(roles)}
          </span>
        </div>

        <div className="mt-4 h-px w-full bg-[rgba(17,20,57,0.08)]" />
      </div>

      {/* Nav */}
      <nav className="px-3 pb-6">
        {roles === null ? (
          <MenuSkeleton />
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => {
              const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
              const title = it.label;

              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={isMobile ? onNavigate : undefined}
                    className={cx(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2",
                      active
                        ? "bg-[linear-gradient(135deg,rgba(43,89,255,0.10),rgba(139,92,246,0.06),rgba(17,20,57,0.03))] text-[color:var(--fg)]"
                        : "text-[color:rgba(17,20,57,0.70)] hover:bg-[rgba(17,20,57,0.04)]"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {/* left active indicator */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-opacity",
                        active
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-40"
                      )}
                      style={{
                        background: "linear-gradient(180deg, rgba(43,89,255,0.85), rgba(139,92,246,0.70))",
                      }}
                    />

                    <span
                      className={cx(
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                        active
                          ? "border-[rgba(43,89,255,0.18)] bg-white/70 text-[color:rgba(17,20,57,0.80)]"
                          : "border-[rgba(17,20,57,0.10)] bg-white/60 text-[color:rgba(17,20,57,0.70)]"
                      )}
                    >
                      <Icon name={title} />
                    </span>

                    <span className={cx("font-medium", active ? "text-[color:var(--fg)]" : "")}>
                      {it.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Bottom hint */}
      <div className="mt-auto px-5 pb-6">
        <div className="rounded-2xl border border-[rgba(17,20,57,0.10)] bg-white/60 p-4 text-xs text-[color:rgba(17,20,57,0.62)]">
          Tip: gunakan <span className="font-semibold text-[color:var(--fg)]">Exports</span> untuk audit-ready download.
        </div>
      </div>
    </aside>
  );
}
