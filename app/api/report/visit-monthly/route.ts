import type { NextRequest } from "next/server";
import { jsonOk, jsonError } from "../_lib/handler";
import { HttpError, toSafeErrorMessage } from "../_lib/errors";
import { parseOptionalString, parseQueryMonth } from "../_lib/parse";
import { selectVisitMonthlyMatrixFromView } from "../_lib/db";
import { getReportCtx, requireReportRole } from "../_lib/auth";
import { enforceRateLimit, pruneRateLimitBuckets } from "../_lib/rate-limit";
import { getRequestId } from "../_lib/request-id";
import { logJson } from "../_lib/logger";

export async function GET(req: NextRequest) {
  const endpoint = "/api/report/visit-monthly";
  const request_id = getRequestId(req);
  const t0 = Date.now();

  let userIdForLog = "unknown";

  try {
    const ctx = await getReportCtx();
    userIdForLog = ctx.userId;

    requireReportRole(ctx, ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "VIEWER"]);

    pruneRateLimitBuckets();
    enforceRateLimit({
      key: `${ctx.userId}:${endpoint}`,
      limit: 30,
      windowMs: 60_000,
    });

    logJson({
      level: "info",
      request_id,
      user_id: ctx.userId,
      endpoint,
      message: "report_read_start",
    });

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

    logJson({
      level: "info",
      request_id,
      user_id: ctx.userId,
      endpoint,
      message: "report_read_success",
      duration_ms: Date.now() - t0,
    });

    const res = jsonOk(rows);
    res.headers.set("x-request-id", request_id);
    return res;
  } catch (err: unknown) {
    const isRateLimit = err instanceof HttpError && err.code === "RATE_LIMIT";

    logJson({
      level: isRateLimit ? "warn" : "error",
      request_id,
      user_id: userIdForLog,
      endpoint,
      message: isRateLimit ? "report_read_rate_limited" : "report_read_error",
      duration_ms: Date.now() - t0,
    });

    if (err instanceof HttpError) {
      const res = jsonError(err.code, err.message, err.status);
      res.headers.set("x-request-id", request_id);
      return res;
    }
    const res = jsonError("INTERNAL_ERROR", toSafeErrorMessage(err), 500);
    res.headers.set("x-request-id", request_id);
    return res;
  }
}
