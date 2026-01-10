import type { NextRequest } from "next/server";
import { jsonOk, jsonError } from "../_lib/handler";
import { HttpError, toSafeErrorMessage } from "../_lib/errors";
import { parseOptionalString, parseQueryIsoDate } from "../_lib/parse";
import { selectVisitDailyFromView } from "../_lib/db";
import { getReportCtx, requireReportRole } from "../_lib/auth";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getReportCtx();
    requireReportRole(ctx, ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "VIEWER"]);

    const url = new URL(req.url);

    const start_date_raw = url.searchParams.get("start_date");
    const end_date_raw = url.searchParams.get("end_date");
    const unit_kerja_id = parseOptionalString(url.searchParams.get("unit_kerja_id"));

    const today = new Date();
    const yyyy = String(today.getUTCFullYear());
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const todayIso = `${yyyy}-${mm}-${dd}`;

    const start_date = parseQueryIsoDate(start_date_raw ?? todayIso, "start_date");
    const end_date = parseQueryIsoDate(end_date_raw ?? todayIso, "end_date");

    const rows = await selectVisitDailyFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      start_date,
      end_date,
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
