export type UserRole =
  | "FA"
  | "BRANCH_MANAGER"
  | "COMPANY_ADMIN"
  | "VIEWER"
  | "AUDITOR";

export type ReportCtx = {
  userId: string;
  roles: UserRole[];
  // internal-only (server-side), boleh ada di ctx, TAPI tidak boleh bocor lewat endpoint debug
  companyId: string;
  allowedBranchIds: string[];
};

export function makeReportCtx(
  input: Partial<ReportCtx> & { roles: UserRole[] }
): ReportCtx {
  return {
    userId: input.userId ?? "00000000-0000-0000-0000-000000000001",
    roles: input.roles,
    companyId: input.companyId ?? "11111111-1111-1111-1111-111111111111",
    allowedBranchIds:
      input.allowedBranchIds ?? ["22222222-2222-2222-2222-222222222222"],
  };
}
