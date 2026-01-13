// app/(app)/_lib/nav.ts
import type { UserRole } from "./me";

export type NavItem = {
  label: string;
  href: string;
  roles?: UserRole[]; // jika undefined => semua role boleh lihat
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },

  {
    label: "Visit",
    href: "/visit",
    roles: ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"],
  },
  {
    label: "Daily Leads",
    href: "/daily-leads",
    roles: ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"],
  },
  {
    label: "Exports",
    href: "/exports",
    roles: ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "AUDITOR"],
  },

  { label: "Settings", href: "/settings" },
];

export function filterNavByRole(items: NavItem[], roles: UserRole[]) {
  return items.filter((it) => {
    if (!it.roles) return true;
    return roles.some((r) => it.roles!.includes(r));
  });
}
