import { getReportCtx } from "@/app/api/report/_lib/auth";
import { requireReportRole } from "@/app/api/report/_lib/rbac";
import { writeAuditLog } from "@/app/api/report/_lib/audit";
import { HttpError, toSafeErrorMessage } from "@/app/api/report/_lib/errors";
import { selectVisitDailyFromView, type VisitDailyViewRow } from "@/app/api/report/_lib/db";
import { addSheet, appendTotalRow, autoFitColumns, createWorkbook } from "@/app/api/report/_lib/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_ROLES = ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "AUDITOR"] as const;

// wajib UUID (kolom entity_id = uuid)
const ENTITY_ID_EXPORT_VISIT_DAILY = "00000000-0000-0000-0000-000000000001";

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

    const rows: VisitDailyViewRow[] = await selectVisitDailyFromView({
      companyId: ctx.companyId,
      allowedBranchIds: ctx.allowedBranchIds,
      start_date,
      end_date,
      unit_kerja_id,
    });

    const wb = createWorkbook();
    const ws = addSheet(wb, {
      name: "Visit Daily",
      columns: [
        { header: "date", key: "date", type: "date" },
        { header: "unit_kerja_id", key: "unit_kerja_id", type: "text" },
        { header: "total_telling", key: "total_telling", type: "int" },
      ],
    });

    for (const r of rows) {
      ws.addRow({
        date: r.date,
        unit_kerja_id: r.unit_kerja_id,
        total_telling: toNumber(r.total_telling),
      });
    }

    appendTotalRow(ws, { sums: [{ key: "total_telling" }] });
    autoFitColumns(ws);

    // AUDIT hard-fail
    try {
      await writeAuditLog({
        action: "REPORT_EXPORT", // ✅ sesuai enum
        companyId: ctx.companyId,
        branchId: null,
        actorUserId: ctx.userId,
        entityTable: "report_export",
        entityId: ENTITY_ID_EXPORT_VISIT_DAILY, // ✅ uuid
        metadata: {
          report_name: "visit-daily",
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

    const file = `visit-daily_${yyyymmddToday()}.xlsx`;
    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch (e: unknown) {
    if (e instanceof HttpError) return jsonErr(e.status, e.code, e.message);

    console.error("[visit-daily.xlsx] export failed:", e);
    const msg =
      process.env.NODE_ENV !== "production"
        ? `Export failed: ${toSafeErrorMessage(e)}`
        : "Export failed";

    return jsonErr(500, "INTERNAL_ERROR", msg);
  }
}
