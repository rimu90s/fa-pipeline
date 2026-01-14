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
    <div className="px-2 pb-6">
      <div className="space-y-2 px-3 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
        <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
      </div>
    </div>
  );
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
        "min-h-dvh w-64 border-r bg-white",
        isMobile ? "w-full" : "hidden md:block"
      )}
      aria-label="Primary navigation"
    >
      <div className="px-4 py-5">
        <div className="text-sm font-semibold tracking-wide">FA Reporting</div>
        <div className="text-xs text-muted-foreground">Operations</div>
      </div>

      <nav className="px-2 pb-6">
        {roles === null ? (
          <MenuSkeleton />
        ) : (
          <ul className="space-y-1">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={isMobile ? onNavigate : undefined}
                    className={cx(
                      "block rounded-lg px-3 py-2 text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                      active ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
