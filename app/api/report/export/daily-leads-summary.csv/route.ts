import { NextResponse } from "next/server";
import { getReportCtx } from "@/app/api/report/_lib/auth";
import { requireReportRole } from "@/app/api/report/_lib/rbac";
import { writeAuditLog } from "@/app/api/report/_lib/audit";
import { HttpError } from "@/app/api/report/_lib/errors";
import {
  selectDailyLeadsSummaryFromView,
  type DailyLeadsSummaryViewRow,
} from "@/app/api/report/_lib/db";

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

function jsonErr(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
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

    // ✅ IMPORTANT: gunakan tipe VIEW, bukan tipe legacy
    const rows: DailyLeadsSummaryViewRow[] = await selectDailyLeadsSummaryFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      start_date,
      end_date,
      unit_kerja_id,
    });

    // AUDIT wajib (hard fail jika gagal)
    await writeAuditLog({
      action: "REPORT_EXPORT",
      companyId: ctx.companyId,
      branchId: ctx.allowedBranchIds[0] ?? null,
      actorUserId: ctx.userId,
      entityTable: "report_export",
      entityId: null,
      metadata: {
        report_name: "daily-leads-summary",
        start_date,
        end_date,
        unit_kerja_id: unit_kerja_id ?? null,
        row_count: rows.length,
      },
    });

    const cols = [
      "date",
      "unit_kerja_id",
      "total_leads",
      "total_won",
      "total_lost",
      "total_follow_up",
    ];

    const csv = toCsv(rows as unknown as Array<Record<string, unknown>>, cols);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName(
          "daily-leads-summary",
          start_date,
          end_date
        )}"`,
      },
    });
  } catch (e: unknown) {
    if (e instanceof HttpError) return jsonErr(e.status, e.code, e.message);
    return jsonErr(500, "INTERNAL_ERROR", "Export failed");
  }
}
