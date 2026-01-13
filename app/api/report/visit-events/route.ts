import type { NextRequest } from "next/server";
import { jsonCreated, jsonError } from "../_lib/handler";
import { HttpError, toSafeErrorMessage } from "../_lib/errors";
import { parseJson, parseVisitEventCreatePayload } from "../_lib/parse";
import { insertVisitEvent, resolveWorkUnitScopeOrThrow, writeAuditLog } from "../_lib/db";
import { getReportCtx, requireReportRole } from "../_lib/auth";
import { enforceRateLimit, pruneRateLimitBuckets } from "../_lib/rate-limit";
import { getRequestId } from "../_lib/request-id";
import { logJson } from "../_lib/logger";

export async function POST(req: NextRequest) {
  const endpoint = "/api/report/visit-events";
  const request_id = getRequestId(req);
  const t0 = Date.now();

  let userIdForLog = "unknown";

  try {
    const ctx = await getReportCtx();
    userIdForLog = ctx.userId;

    requireReportRole(ctx, ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN"]);

    // Guard: rate limit write endpoint (operational hardening)
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
      message: "write_start",
    });

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
        request_id,
        endpoint,
        event_date: inserted.event_date,
        unit_kerja_id: inserted.unit_kerja_id,
        metric: inserted.metric,
      },
    });

    logJson({
      level: "info",
      request_id,
      user_id: ctx.userId,
      endpoint,
      message: "write_success",
      duration_ms: Date.now() - t0,
    });

    const res = jsonCreated({
      id: inserted.id,
      event_date: inserted.event_date,
      unit_kerja_id: inserted.unit_kerja_id,
      metric: inserted.metric,
    });
    res.headers.set("x-request-id", request_id);
    return res;
  } catch (err: unknown) {
    const isRateLimit = err instanceof HttpError && err.code === "RATE_LIMIT";

    logJson({
      level: isRateLimit ? "warn" : "error",
      request_id,
      user_id: userIdForLog,
      endpoint,
      message: isRateLimit ? "write_rate_limited" : "write_error",
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
