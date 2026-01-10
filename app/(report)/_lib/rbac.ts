import { ReportRole } from "./types";

export function hasAnyRole(
  userRoles: ReportRole[],
  allowed: ReportRole[]
): boolean {
  return userRoles.some((r) => allowed.includes(r));
}

export const WRITE_ROLES: ReportRole[] = [
  "FA",
  "BRANCH_MANAGER",
  "COMPANY_ADMIN",
];
