import { getReportCtx } from "@/app/api/report/_lib/auth";
import { requireReportRole } from "@/app/api/report/_lib/rbac";
import { writeAuditLog } from "@/app/api/report/_lib/audit";
import { HttpError, toSafeErrorMessage } from "@/app/api/report/_lib/errors";
import { selectDailyLeadsSummaryFromView, type DailyLeadsSummaryViewRow } from "@/app/api/report/_lib/db";
import { addSheet, appendTotalRow, autoFitColumns, createWorkbook } from "@/app/api/report/_lib/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_ROLES = ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "AUDITOR"] as const;
const ENTITY_ID_EXPORT_DAILY_LEADS_SUMMARY = "00000000-0000-0000-0000-000000000002";

function jsonErr(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
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
  try {
    const ctx = await getReportCtx();
    if (!ctx?.userId) return jsonErr(401, "UNAUTHORIZED", "Not authenticated");

    requireReportRole(ctx, [...EXPORT_ROLES]);

    const { searchParams } = new URL(req.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const unit_kerja_id = searchParams.get("unit_kerja_id") ?? undefined;

    if (!start_date || !end_date) {
      return jsonErr(422, "INVALID", "start_date & end_date required");
    }

    const rows: DailyLeadsSummaryViewRow[] = await selectDailyLeadsSummaryFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      start_date,
      end_date,
      unit_kerja_id,
    });

    const wb = createWorkbook();
    const ws = addSheet(wb, {
      name: "Daily Leads Summary",
      columns: [
        { header: "date", key: "date", type: "date" },
        { header: "unit_kerja_id", key: "unit_kerja_id", type: "text" },
        { header: "total_leads", key: "total_leads", type: "int" },
        // VIEW daily tidak punya total_estimated_value → 0 agar total row tetap sesuai SOP
        { header: "total_estimated_value", key: "total_estimated_value", type: "currency" },
        { header: "total_won", key: "total_won", type: "int" },
        { header: "total_lost", key: "total_lost", type: "int" },
        { header: "total_follow_up", key: "total_follow_up", type: "int" },
      ],
    });

    for (const r of rows) {
      ws.addRow({
        date: r.date,
        unit_kerja_id: r.unit_kerja_id,
        total_leads: toNumber(r.total_leads),
        total_estimated_value: 0,
        total_won: toNumber(r.total_won),
        total_lost: toNumber(r.total_lost),
        total_follow_up: toNumber(r.total_follow_up),
      });
    }

    appendTotalRow(ws, { sums: [{ key: "total_leads" }, { key: "total_estimated_value" }] });
    autoFitColumns(ws);

    try {
      await writeAuditLog({
        action: "REPORT_EXPORT",
        companyId: ctx.companyId,
        branchId: null,
        actorUserId: ctx.userId,
        entityTable: "report_export",
        entityId: ENTITY_ID_EXPORT_DAILY_LEADS_SUMMARY,
        metadata: {
          report_name: "daily-leads-summary",
          start_date,
          end_date,
          unit_kerja_id: unit_kerja_id ?? null,
          row_count: rows.length,
        },
      });
    } catch {
      return jsonErr(500, "AUDIT_FAILED", "Audit log write failed");
    }

    const buf = await wb.xlsx.writeBuffer();
    const ab = toStrictArrayBuffer(buf);

    const file = `daily-leads-summary_${yyyymmddToday()}.xlsx`;
    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch (e: unknown) {
    if (e instanceof HttpError) return jsonErr(e.status, e.code, e.message);

    console.error("[daily-leads-summary.xlsx] export failed:", e);
    const msg =
      process.env.NODE_ENV !== "production"
        ? `Export failed: ${toSafeErrorMessage(e)}`
        : "Export failed";

    return jsonErr(500, "INTERNAL_ERROR", msg);
  }
}
