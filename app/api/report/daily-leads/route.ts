import type { NextRequest } from "next/server";
import { jsonCreated, jsonError } from "../_lib/handler";
import { HttpError, toSafeErrorMessage } from "../_lib/errors";
import { parseJson, parseDailyLeadCreatePayload } from "../_lib/parse";
import { insertDailyLead, resolveWorkUnitScopeOrThrow, writeAuditLog } from "../_lib/db";
import { getReportCtx, requireReportRole } from "../_lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getReportCtx();
    requireReportRole(ctx, ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"]);

    const raw = await parseJson(req);
    const payload = parseDailyLeadCreatePayload(raw);

    const { branch_id: resolvedBranchId } = await resolveWorkUnitScopeOrThrow(
      {
        companyId: ctx.companyId,
        allowedBranchIds: ctx.allowedBranchIds,
        userId: ctx.userId,
      },
      payload.unit_kerja_id
    );

    const inserted = await insertDailyLead({
      companyId: ctx.companyId,
      branchId: resolvedBranchId,
      createdBy: ctx.userId,

      leadDate: payload.lead_date,
      unitKerjaId: payload.unit_kerja_id,
      customerId: payload.customer_id ?? null,
      prospectName: payload.prospect_name ?? null,
      productId: payload.product_id ?? null,
      status: payload.status,
      estimatedValue: payload.estimated_value ?? null,
      notes: payload.notes ?? null,
    });

    await writeAuditLog({
      companyId: ctx.companyId,
      branchId: resolvedBranchId,
      actorId: ctx.userId,
      action: "create",
      entityTable: "daily_leads",
      entityId: inserted.id,
      metadata: {
        lead_date: inserted.lead_date,
        unit_kerja_id: inserted.unit_kerja_id,
        status: inserted.status,
        estimated_value: inserted.estimated_value,
      },
    });

    return jsonCreated({
      id: inserted.id,
      lead_date: inserted.lead_date,
      unit_kerja_id: inserted.unit_kerja_id,
      status: inserted.status,
      estimated_value: inserted.estimated_value,
    });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return jsonError(err.code, err.message, err.status);
    }
    return jsonError("INTERNAL_ERROR", toSafeErrorMessage(err), 500);
  }
}
