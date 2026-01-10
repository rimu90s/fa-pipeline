import { resolveAuthContext, type AuthContext } from "../../master/_lib/context";
import { requireAnyRole, type UserRole } from "../../master/_lib/rbac";

export type ReportCtx = {
  userId: string;
  companyId: string;
  allowedBranchIds: string[];
};

export async function getReportCtx(): Promise<AuthContext & ReportCtx> {
  const ctx = await resolveAuthContext(); // master: no args
  return ctx as AuthContext & ReportCtx;
}

export function requireReportRole(ctx: AuthContext, roles: UserRole[]) {
  requireAnyRole(ctx, roles);
}
