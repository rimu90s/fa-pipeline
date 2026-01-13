"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { filterNavByRole, NAV_ITEMS } from "../_lib/nav";
import { getReportUserContext, type UserRole } from "../_lib/me";

export default function Sidebar() {
  const pathname = usePathname();
  const [roles, setRoles] = useState<UserRole[] | null>(null);

  useEffect(() => {
    let alive = true;
    getReportUserContext()
      .then((ctx) => {
        if (alive) setRoles(ctx.roles);
      })
      .catch(() => {
        if (alive) setRoles([]); // fallback UI, redirect handled elsewhere
      });
    return () => {
      alive = false;
    };
  }, []);

  const items = roles ? filterNavByRole(NAV_ITEMS, roles) : [];

  return (
    <aside className="hidden min-h-dvh w-64 border-r bg-white md:block">
      <div className="px-4 py-5">
        <div className="text-sm font-semibold tracking-wide">FA Reporting</div>
        <div className="text-xs text-muted-foreground">Operations</div>
      </div>

      <nav className="px-2 pb-6">
        {roles === null ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Loading menu…</div>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm",
                      active ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50",
                    ].join(" ")}
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
