import type { NextRequest } from "next/server";
import { jsonCreated, jsonError } from "../_lib/handler";
import { HttpError, toSafeErrorMessage } from "../_lib/errors";
import { parseJson, parseVisitEventCreatePayload } from "../_lib/parse";
import { insertVisitEvent, resolveWorkUnitScopeOrThrow, writeAuditLog } from "../_lib/db";
import { getReportCtx, requireReportRole } from "../_lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getReportCtx();
    requireReportRole(ctx, ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"]);

    const raw = await parseJson(req);
    const payload = parseVisitEventCreatePayload(raw);

    const { branch_id: resolvedBranchId } = await resolveWorkUnitScopeOrThrow(
      {
        companyId: ctx.companyId,
        allowedBranchIds: ctx.allowedBranchIds,
        userId: ctx.userId,
      },
      payload.unit_kerja_id
    );

    const inserted = await insertVisitEvent({
      companyId: ctx.companyId,
      branchId: resolvedBranchId,
      createdBy: ctx.userId,
      eventType: "TELLING",
      eventDate: payload.event_date,
      unitKerjaId: payload.unit_kerja_id,
      metric: payload.metric,
      notes: payload.notes,
    });

    await writeAuditLog({
      companyId: ctx.companyId,
      branchId: resolvedBranchId,
      actorId: ctx.userId,
      action: "create",
      entityTable: "visit_events",
      entityId: inserted.id,
      metadata: {
        event_date: inserted.event_date,
        unit_kerja_id: inserted.unit_kerja_id,
        metric: inserted.metric,
      },
    });

    return jsonCreated({
      id: inserted.id,
      event_date: inserted.event_date,
      unit_kerja_id: inserted.unit_kerja_id,
      metric: inserted.metric,
    });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return jsonError(err.code, err.message, err.status);
    }
    return jsonError("INTERNAL_ERROR", toSafeErrorMessage(err), 500);
  }
}
