import type { NextRequest } from "next/server";
import { jsonOk, jsonError } from "../_lib/handler";
import { HttpError, toSafeErrorMessage } from "../_lib/errors";
import { parseOptionalString, parseQueryMonth } from "../_lib/parse";
import { selectVisitMonthlyMatrixFromView } from "../_lib/db";
import { getReportCtx, requireReportRole } from "../_lib/auth";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getReportCtx();
    requireReportRole(ctx, ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "VIEWER"]);

    const url = new URL(req.url);

    const month_start = parseQueryMonth(url.searchParams.get("month_start"), "month_start");
    const month_end = parseQueryMonth(url.searchParams.get("month_end"), "month_end");
    const unit_kerja_id = parseOptionalString(url.searchParams.get("unit_kerja_id"));

    const rows = await selectVisitMonthlyMatrixFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      month_start,
      month_end,
      unit_kerja_id,
    });

    return jsonOk(rows);
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return jsonError(err.code, err.message, err.status);
    }
    return jsonError("INTERNAL_ERROR", toSafeErrorMessage(err), 500);
  }
}
