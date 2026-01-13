import { NextResponse } from "next/server";
import { getReportCtx } from "@/app/api/report/_lib/auth";
import { requireReportRole } from "@/app/api/report/_lib/rbac";
import { writeAuditLog } from "@/app/api/report/_lib/audit";
import { HttpError } from "@/app/api/report/_lib/errors";
import {
  selectDailyLeadsSummaryFromView,
  type DailyLeadsSummaryViewRow,
} from "@/app/api/report/_lib/db";
import { enforceRateLimit, pruneRateLimitBuckets } from "@/app/api/report/_lib/rate-limit";
import { getRequestId } from "@/app/api/report/_lib/request-id";
import { logJson } from "@/app/api/report/_lib/logger";
import { createTimeoutController, clearTimeoutTimer, throwIfAborted } from "@/app/api/report/_lib/timeout";

const EXPORT_ROLES = ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "AUDITOR"] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (!/[",\n\r]/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>, cols: string[]): string {
  const header = cols.map(csvEscape).join(",");
  const lines = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n") + "\n";
}

function fileName(prefix: string, start: string, end: string) {
  return `${prefix}_${start.replaceAll("-", "")}-${end.replaceAll("-", "")}.csv`;
}

function jsonErr(request_id: string, status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "x-request-id": request_id } }
  );
}

export async function GET(req: Request) {
  const endpoint = "/api/report/export/daily-leads-summary.csv";
  const request_id = getRequestId(req);
  const t0 = Date.now();

  const { controller, timer } = createTimeoutController(15_000);
  const { signal } = controller;

  let userIdForLog = "unknown";

  try {
    const ctx = await getReportCtx();
    if (!ctx?.userId) return jsonErr(request_id, 401, "UNAUTHORIZED", "Not authenticated");
    userIdForLog = ctx.userId;

    pruneRateLimitBuckets();
    enforceRateLimit({
      key: `${ctx.userId}:${endpoint}`,
      limit: 5,
      windowMs: 60_000,
    });

    requireReportRole(ctx, [...EXPORT_ROLES]);

    logJson({
      level: "info",
      request_id,
      user_id: ctx.userId,
      endpoint,
      message: "export_start",
    });

    const { searchParams } = new URL(req.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const unit_kerja_id = searchParams.get("unit_kerja_id") ?? undefined;

    if (!start_date || !end_date) {
      return jsonErr(request_id, 422, "INVALID", "start_date & end_date required");
    }

    throwIfAborted(signal);

    const rows: DailyLeadsSummaryViewRow[] = await selectDailyLeadsSummaryFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      start_date,
      end_date,
      unit_kerja_id,
    });

    throwIfAborted(signal);

    const cols = [
      "date",
      "unit_kerja_id",
      "total_leads",
      "total_won",
      "total_lost",
      "total_follow_up",
    ];

    const csv = toCsv(rows as unknown as Array<Record<string, unknown>>, cols);

    // RULE: timeout → no audit. Jadi cek abort sebelum audit.
    throwIfAborted(signal);

    await writeAuditLog({
      action: "REPORT_EXPORT",
      companyId: ctx.companyId,
      branchId: ctx.allowedBranchIds[0] ?? null,
      actorUserId: ctx.userId,
      entityTable: "report_export",
      entityId: null,
      metadata: {
        request_id,
        endpoint,
        report_name: "daily-leads-summary",
        start_date,
        end_date,
        unit_kerja_id: unit_kerja_id ?? null,
        row_count: rows.length,
      },
    });

    logJson({
      level: "info",
      request_id,
      user_id: ctx.userId,
      endpoint,
      message: "export_success",
      duration_ms: Date.now() - t0,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName(
          "daily-leads-summary",
          start_date,
          end_date
        )}"`,
        "x-request-id": request_id,
      },
    });
  } catch (e: unknown) {
    const isTimeout = e instanceof HttpError && e.code === "TIMEOUT";

    logJson({
      level: isTimeout ? "warn" : "error",
      request_id,
      user_id: userIdForLog,
      endpoint,
      message: isTimeout ? "export_timeout" : "export_error",
      duration_ms: Date.now() - t0,
    });

    if (e instanceof HttpError) return jsonErr(request_id, e.status, e.code, e.message);
    return jsonErr(request_id, 500, "INTERNAL_ERROR", "Export failed");
  } finally {
    clearTimeoutTimer(timer);
  }
}
