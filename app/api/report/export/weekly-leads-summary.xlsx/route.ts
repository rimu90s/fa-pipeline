import { getReportCtx } from "@/app/api/report/_lib/auth";
import { requireReportRole } from "@/app/api/report/_lib/rbac";
import { writeAuditLog } from "@/app/api/report/_lib/audit";
import { HttpError, toSafeErrorMessage } from "@/app/api/report/_lib/errors";
import { selectWeeklyLeadsSummaryFromView, type WeeklyLeadsSummaryViewRow } from "@/app/api/report/_lib/db";
import { addSheet, appendTotalRow, autoFitColumns, createWorkbook } from "@/app/api/report/_lib/excel";
import { enforceRateLimit, pruneRateLimitBuckets } from "@/app/api/report/_lib/rate-limit";
import { getRequestId } from "@/app/api/report/_lib/request-id";
import { logJson } from "@/app/api/report/_lib/logger";
import { createTimeoutController, clearTimeoutTimer, throwIfAborted } from "@/app/api/report/_lib/timeout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_ROLES = ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "AUDITOR"] as const;
const ENTITY_ID_EXPORT_WEEKLY_LEADS_SUMMARY = "00000000-0000-0000-0000-000000000003";

function jsonErr(request_id: string, status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "x-request-id": request_id } });
}

function yyyymmddToday() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

function toStrictArrayBuffer(v: unknown): ArrayBuffer {
  if (v instanceof ArrayBuffer) return v;
  if (ArrayBuffer.isView(v)) return u8ToArrayBuffer(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
  if (typeof v === "string") return u8ToArrayBuffer(new TextEncoder().encode(v));
  return u8ToArrayBuffer(new TextEncoder().encode(JSON.stringify(v)));
}

export async function GET(req: Request) {
  const endpoint = "/api/report/export/weekly-leads-summary.xlsx";
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

    const rows: WeeklyLeadsSummaryViewRow[] = await selectWeeklyLeadsSummaryFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      start_date,
      end_date,
      unit_kerja_id,
    });

    throwIfAborted(signal);

    const wb = createWorkbook();
    const ws = addSheet(wb, {
      name: "Weekly Leads Summary",
      columns: [
        { header: "week_start", key: "week_start", type: "date" },
        { header: "unit_kerja_id", key: "unit_kerja_id", type: "text" },
        { header: "total_leads", key: "total_leads", type: "int" },
        { header: "total_estimated_value", key: "total_estimated_value", type: "currency" },
      ],
    });

    for (const r of rows) {
      throwIfAborted(signal);
      ws.addRow({
        week_start: r.week_start,
        unit_kerja_id: r.unit_kerja_id,
        total_leads: toNumber(r.total_leads),
        total_estimated_value: toNumber(r.total_estimated_value),
      });
    }

    appendTotalRow(ws, { sums: [{ key: "total_leads" }, { key: "total_estimated_value" }] });
    autoFitColumns(ws);

    throwIfAborted(signal);

    try {
      await writeAuditLog({
        action: "REPORT_EXPORT",
        companyId: ctx.companyId,
        branchId: null,
        actorUserId: ctx.userId,
        entityTable: "report_export",
        entityId: ENTITY_ID_EXPORT_WEEKLY_LEADS_SUMMARY,
        metadata: {
          request_id,
          endpoint,
          report_name: "weekly-leads-summary",
          start_date,
          end_date,
          unit_kerja_id: unit_kerja_id ?? null,
          row_count: rows.length,
        },
      });
    } catch {
      return jsonErr(request_id, 500, "AUDIT_FAILED", "Audit log write failed");
    }

    throwIfAborted(signal);

    const buf = await wb.xlsx.writeBuffer();
    const ab = toStrictArrayBuffer(buf);

    const file = `weekly-leads-summary_${yyyymmddToday()}.xlsx`;

    logJson({
      level: "info",
      request_id,
      user_id: ctx.userId,
      endpoint,
      message: "export_success",
      duration_ms: Date.now() - t0,
    });

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${file}"`,
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

    const msg = process.env.NODE_ENV !== "production" ? `Export failed: ${toSafeErrorMessage(e)}` : "Export failed";
    return jsonErr(request_id, 500, "INTERNAL_ERROR", msg);
  } finally {
    clearTimeoutTimer(timer);
  }
}
