"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { filterNavByRole, NAV_ITEMS } from "../_lib/nav";
import { getReportUserContext, type UserRole } from "../_lib/me";

type SidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  collapsed?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-[rgba(17,20,57,0.12)] bg-white/85 px-3 py-1.5 text-xs font-medium text-[color:rgba(17,20,57,0.82)] shadow-[0_14px_44px_rgba(17,20,57,0.16)] backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity">
      {label}
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const };
  switch (name) {
    case "Dashboard":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M4 13h8V4H4v9Zm0 7h8v-5H4v5Zm10 0h6V11h-6v9Zm0-18v7h6V2h-6Z"
            fill="currentColor"
            opacity="0.92"
          />
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
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
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

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() || "").join("");
  return letters || "U";
}

function readProfileFromLocalStorage(): { name: string; avatarUrl: string | null } {
  if (typeof window === "undefined") return { name: "Account", avatarUrl: null };
  const name = window.localStorage.getItem("fa.profile.name") || "Account";
  const avatarUrl = window.localStorage.getItem("fa.profile.avatarUrl");
  return { name, avatarUrl: avatarUrl || null };
}

export default function Sidebar({ variant = "desktop", onNavigate, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  const [roles, setRoles] = useState<UserRole[] | null>(null);

  const [profile] = useState<{ name: string; avatarUrl: string | null }>(() => {
    if (typeof window === "undefined") return { name: "Account", avatarUrl: null };
    try {
      return readProfileFromLocalStorage();
    } catch {
      return { name: "Account", avatarUrl: null };
    }
  });

  useEffect(() => {
    let alive = true;
    getReportUserContext()
      .then((ctx) => alive && setRoles(ctx.roles))
      .catch(() => alive && setRoles([]));
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(() => (roles ? filterNavByRole(NAV_ITEMS, roles) : []), [roles]);

  const avatarNode = profile.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatarUrl} alt={profile.name} className="h-10 w-10 rounded-2xl object-cover" />
  ) : (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(17,20,57,0.12)] bg-white/65 text-sm font-semibold text-[color:rgba(17,20,57,0.78)]"
      style={{ boxShadow: "0 14px 44px rgba(17,20,57,0.10)" }}
    >
      {initialsFromName(profile.name)}
    </div>
  );

  // label animation (super smooth)
  const labelCls =
    "min-w-0 overflow-hidden " +
    "transition-[max-width,opacity,transform] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] " +
    (collapsed && !isMobile ? "max-w-0 opacity-0 -translate-x-1" : "max-w-[260px] opacity-100 translate-x-0");

  return (
    <aside className="h-full w-full" aria-label="Primary navigation">
      <div className="flex h-full flex-col">
        {/* Account */}
        <div className={cx("px-4 pt-5 pb-4", collapsed && !isMobile ? "px-3" : "")}>
          <Link
            href="/settings/account"
            onClick={isMobile ? onNavigate : undefined}
            className={cx(
              "group relative flex items-center gap-3 rounded-2xl border border-[rgba(17,20,57,0.10)] bg-white/60 backdrop-blur-xl",
              "px-3 py-3",
              "hover:bg-white/70 hover:shadow-[0_18px_60px_rgba(17,20,57,0.10)]",
              "transition-[box-shadow,background-color] duration-200",
              collapsed && !isMobile ? "px-2" : ""
            )}
            aria-label="Account settings"
            title={collapsed && !isMobile ? profile.name : undefined}
          >
            <div className="relative">
              {avatarNode}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"
                style={{ boxShadow: "0 10px 24px rgba(16,185,129,0.25)" }}
              />
            </div>

            <div className={labelCls} aria-hidden={collapsed && !isMobile}>
              <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{profile.name}</div>
              <div className="mt-0.5 truncate text-xs text-[color:rgba(17,20,57,0.58)]">{roleBadge(roles)}</div>
            </div>

            {collapsed && !isMobile ? <Tooltip label={profile.name} /> : null}
          </Link>

          <div className="mt-4 h-px w-full bg-[rgba(17,20,57,0.08)]" />
        </div>

        {/* Nav */}
        <nav className={cx("flex-1 overflow-y-auto pb-6", collapsed && !isMobile ? "px-2" : "px-3")}>
          <ul className="space-y-1.5">
            {items.map((it) => {
              const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
              const label = it.label;

              return (
                <li key={it.href} className="relative">
                  <Link
                    href={it.href}
                    onClick={isMobile ? onNavigate : undefined}
                    className={cx(
                      "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                      "transition-[background,box-shadow] duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(43,89,255,0.25)] focus-visible:ring-offset-2",
                      active
                        ? "bg-[linear-gradient(135deg,rgba(43,89,255,0.14),rgba(139,92,246,0.08),rgba(17,20,57,0.03))] text-[color:var(--fg)] shadow-[0_18px_54px_rgba(43,89,255,0.12)]"
                        : "text-[color:rgba(17,20,57,0.72)] hover:bg-[rgba(17,20,57,0.06)]"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cx(
                        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white/60 backdrop-blur-xl",
                        active
                          ? "border-[rgba(43,89,255,0.20)] text-[color:rgba(17,20,57,0.82)]"
                          : "border-[rgba(17,20,57,0.12)] text-[color:rgba(17,20,57,0.72)]"
                      )}
                    >
                      <Icon name={label} />
                    </span>

                    <span className={labelCls} aria-hidden={collapsed && !isMobile}>
                      <span className={cx("font-semibold", active && "text-[color:var(--fg)]")}>{label}</span>
                    </span>

                    {collapsed && !isMobile ? <Tooltip label={label} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom tip */}
        {!collapsed || isMobile ? (
          <div className="px-4 pb-6">
            <div className="rounded-2xl border border-[rgba(17,20,57,0.10)] bg-white/55 p-4 text-xs text-[color:rgba(17,20,57,0.62)] backdrop-blur-xl shadow-[0_16px_54px_rgba(17,20,57,0.10)]">
              Tip: gunakan <span className="font-semibold text-[color:var(--fg)]">Exports</span> untuk audit-ready download.
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
