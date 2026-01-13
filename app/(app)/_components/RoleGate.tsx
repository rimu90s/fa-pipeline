"use client";

import type { ReactNode } from "react";
import type { UserRole } from "../_lib/me";

type Props = {
  allowed: UserRole[];
  roles: UserRole[]; // kita supply dari page
  children: ReactNode;
};

export default function RoleGate({ allowed, roles, children }: Props) {
  const ok = roles.some((r) => allowed.includes(r));

  if (!ok) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="text-lg font-semibold">No access</div>
        <div className="mt-1 text-sm text-muted-foreground">
          You don’t have permission to view this section.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
