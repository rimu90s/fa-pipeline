import { HttpError } from "./errors";

export type ReportRole = "FA" | "VIEWER" | "BRANCH_MANAGER" | "COMPANY_ADMIN" | "AUDITOR";

export function requireReportRole(ctx: { roles: string[] }, allowed: ReportRole[]): void {
  const roles = Array.isArray(ctx.roles) ? ctx.roles : [];
  const ok = roles.some((r) => allowed.includes(r as ReportRole));

  if (!ok) {
    throw new HttpError(403, "FORBIDDEN", "Anda tidak punya akses");
  }
}
