"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getReportUserContext, type UserRole } from "./_lib/me";
import StatCard from "./_components/StatCard";
import RoleGate from "./_components/RoleGate";

export default function DashboardPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[] | null>(null);

  useEffect(() => {
    let alive = true;
    getReportUserContext()
      .then((ctx) => {
        if (alive) setRoles(ctx.roles);
      })
      .catch(() => {
        router.replace("/login");
      });
    return () => {
      alive = false;
    };
  }, [router]);

  if (roles === null) {
    return <div className="text-sm text-muted-foreground">Loading dashboard…</div>;
  }

  const canInput = roles.some((r) => ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"].includes(r));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick overview for the last 7 days.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Visit (last 7 days)" value={canInput ? "—" : "—"} />
        <StatCard title="Leads (last 7 days)" value={canInput ? "—" : "—"} />
        <StatCard title="Exports available" value="Yes" />
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="text-base font-semibold">Quick actions</div>
        <div className="mt-3 flex gap-2">
          <RoleGate allowed={["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"]} roles={roles}>
            <a className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50" href="/visit">
              Create Visit
            </a>
          </RoleGate>
          <RoleGate allowed={["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"]} roles={roles}>
            <a
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
              href="/daily-leads"
            >
              Create Daily Leads
            </a>
          </RoleGate>
        </div>
      </div>
    </div>
  );
}
