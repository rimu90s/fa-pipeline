// app/api/report/_lib/db.ts
import { HttpError } from "./errors";
import { getServiceSupabase } from "./supabase";

export type AllowedScope = {
  companyId: string;
  allowedBranchIds: string[];
  userId: string;
};

export type WorkUnitRow = {
  id: string;
  companyId: string;
  branch_id: string | null;
};

export type InsertVisitEventArgs = {
  companyId: string;
  branchId: string;
  createdBy: string;
  eventType: "TELLING";
  eventDate: string; // YYYY-MM-DD
  unitKerjaId: string;
  metric: number;
  notes?: string;
};

export type InsertedVisitEvent = {
  id: string;
  event_date: string;
  unit_kerja_id: string;
  metric: number;
};

export type InsertDailyLeadArgs = {
  companyId: string;
  branchId: string;
  createdBy: string;

  leadDate: string; // YYYY-MM-DD
  unitKerjaId: string;
  customerId: string | null;
  prospectName: string | null;
  productId: string | null;
  status: "won" | "lost" | "follow_up";
  estimatedValue: number | null;
  notes: string | null;
};

export type InsertedDailyLead = {
  id: string;
  lead_date: string;
  unit_kerja_id: string;
  status: "won" | "lost" | "follow_up";
  estimated_value: number | null;
};

export type AuditLogInsert =
  | {
      companyId: string;
      branchId: string;
      actorId: string;
      action: "create";
      entityTable: "visit_events";
      entityId: string;
      metadata: {
        event_date: string;
        unit_kerja_id: string;
        metric: number;
      };
    }
  | {
      companyId: string;
      branchId: string;
      actorId: string;
      action: "create";
      entityTable: "daily_leads";
      entityId: string;
      metadata: {
        lead_date: string;
        unit_kerja_id: string;
        status: "won" | "lost" | "follow_up";
        estimated_value: number | null;
      };
    };

/**
 * ✅ ADD (PROMPT 7): audit log khusus export (VIEW ONLY) — hard fail jika gagal.
 * Note: entityTable diset ke "report_export" sesuai requirement prompt 7.2.4.
 */
export type ReportExportAuditLogInsert = {
  companyId: string;
  // branchId boleh null jika export lintas branch (tetap tenant-safe via filters)
  branchId: string | null;
  actorId: string;
  action: "export";
  entityTable: "report_export";
  entityId: string; // bisa pakai "visit-daily" / "daily-leads-summary" / "weekly-leads-summary" atau uuid bila ada
  metadata: {
    report_name: "visit-daily" | "daily-leads-summary" | "weekly-leads-summary";
    start_date: string;
    end_date: string;
    unit_kerja_id?: string | null;
    row_count: number;
  };
};

// (legacy types — tetap dibiarkan supaya tidak memutus dependensi internal lain)
export type VisitDailyRow = {
  companyId: string;
  branch_id: string;
  unit_kerja_id: string;
  date: string; // YYYY-MM-DD
  metric: number;
};

export type VisitMonthlyMatrixRow = {
  companyId: string;
  branch_id: string;
  unit_kerja_id: string;
  month: string; // YYYY-MM-DD (month start)
  metric: number;
};

export type DailyLeadsSummaryRow = {
  companyId: string;
  branch_id: string;
  unit_kerja_id: string;
  date: string; // YYYY-MM-DD
  [k: string]: unknown;
};

export type WeeklyLeadsSummaryRow = {
  companyId: string;
  branch_id: string;
  unit_kerja_id: string;
  week_start: string; // YYYY-MM-DD
  week_end?: string;
  [k: string]: unknown;
};

function branchAllowed(allowed: string[], branchId: string): boolean {
  return allowed.includes(branchId);
}

/**
 * ✅ ADD (PROMPT 7): validasi YYYY-MM-DD yang strict + error 422 konsisten
 */
function assertIsoDateOnlyOrThrow(s: string, fieldName: string): void {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new HttpError(422, "BAD_REQUEST", `${fieldName} harus format YYYY-MM-DD`);
  }
  const d = new Date(`${s}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) {
    throw new HttpError(422, "BAD_REQUEST", `${fieldName} tidak valid`);
  }
}

/**
 * ✅ ADD (PROMPT 7): type helper untuk range export (daily/weekly)
 */
export type ExportRangeArgs = {
  companyId: string;
  allowedBranchIds: string[];
  start_date: string;
  end_date: string;
  unit_kerja_id?: string;
};

/**
 * Resolve work_unit (unit kerja) and ensure:
 * - exists
 * - same company
 * - branch_id exists and is in allowed branches
 */
export async function resolveWorkUnitScopeOrThrow(
  scope: AllowedScope,
  unit_kerja_id: string
): Promise<{ branch_id: string }> {
  const db = getServiceSupabase();

  const { data, error } = await db
    .from("work_units")
    .select("id,companyId,branch_id")
    .eq("id", unit_kerja_id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal memvalidasi unit kerja");
  }
  if (!data) {
    throw new HttpError(400, "BAD_REQUEST", "Unit kerja tidak valid");
  }

  const row = data as unknown as WorkUnitRow;
  if (row.companyId !== scope.companyId) {
    throw new HttpError(400, "BAD_REQUEST", "Unit kerja tidak valid");
  }
  if (!row.branch_id) {
    throw new HttpError(400, "BAD_REQUEST", "Unit kerja tidak valid");
  }
  if (!branchAllowed(scope.allowedBranchIds, row.branch_id)) {
    throw new HttpError(403, "FORBIDDEN", "Anda tidak punya akses");
  }

  return { branch_id: row.branch_id };
}

export async function insertVisitEvent(args: InsertVisitEventArgs): Promise<InsertedVisitEvent> {
  const db = getServiceSupabase();

  const { data, error } = await db
    .from("visit_events")
    .insert({
      companyId: args.companyId,
      branch_id: args.branchId,
      created_by: args.createdBy,
      event_type: args.eventType,
      event_date: args.eventDate,
      unit_kerja_id: args.unitKerjaId,
      metric: args.metric,
      notes: args.notes ?? null,
      is_deleted: false,
    })
    .select("id,event_date,unit_kerja_id,metric")
    .single();

  if (error || !data) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal menyimpan event");
  }

  return data as unknown as InsertedVisitEvent;
}

export async function insertDailyLead(args: InsertDailyLeadArgs): Promise<InsertedDailyLead> {
  const db = getServiceSupabase();

  const { data, error } = await db
    .from("daily_leads")
    .insert({
      companyId: args.companyId,
      branch_id: args.branchId,
      created_by: args.createdBy,
      lead_date: args.leadDate,
      unit_kerja_id: args.unitKerjaId,
      customer_id: args.customerId,
      prospect_name: args.prospectName,
      product_id: args.productId,
      status: args.status,
      estimated_value: args.estimatedValue,
      notes: args.notes,
      is_deleted: false,
    })
    .select("id,lead_date,unit_kerja_id,status,estimated_value")
    .single();

  if (error || !data) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal menyimpan daily lead");
  }

  return data as unknown as InsertedDailyLead;
}

export async function writeAuditLog(log: AuditLogInsert): Promise<void> {
  const db = getServiceSupabase();

  const { error } = await db.from("audit_logs").insert({
    companyId: log.companyId,
    branch_id: log.branchId,
    actor_id: log.actorId,
    action: log.action,
    entity_table: log.entityTable,
    entity_id: log.entityId,
    metadata: log.metadata,
  });

  if (error) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal menulis audit log");
  }
}

/**
 * ✅ ADD (PROMPT 7): audit log khusus report export.
 * - entity_table = report_export (hard requirement)
 * - action = export
 * - hard fail kalau insert gagal
 */
export async function writeReportExportAuditLog(log: ReportExportAuditLogInsert): Promise<void> {
  const db = getServiceSupabase();

  const { error } = await db.from("audit_logs").insert({
    companyId: log.companyId,
    branch_id: log.branchId,
    actor_id: log.actorId,
    action: log.action,
    entity_table: log.entityTable,
    entity_id: log.entityId,
    metadata: log.metadata,
  });

  if (error) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal menulis audit log");
  }
}

// ===== VIEW ROW TYPES (match your view columns) =====
// Note: bigint / numeric can be returned as string by Supabase; keep union safe.
export type VisitDailyViewRow = {
  company_id: string;
  branch_id: string;
  date: string; // YYYY-MM-DD
  unit_kerja_id: string;
  total_telling: number | string;
};

export type DailyLeadsSummaryViewRow = {
  company_id: string;
  branch_id: string;
  date: string; // YYYY-MM-DD
  unit_kerja_id: string;
  total_leads: number | string;
  total_won: number | string;
  total_lost: number | string;
  total_follow_up: number | string;
};

export type WeeklyLeadsSummaryViewRow = {
  company_id: string;
  branch_id: string;
  week_start: string; // YYYY-MM-DD
  unit_kerja_id: string;
  total_leads: number | string;
  total_estimated_value: number | string;
};

export async function selectVisitDailyFromView(args: {
  companyId: string;
  allowedBranchIds: string[];
  start_date: string;
  end_date: string;
  unit_kerja_id?: string;
}): Promise<VisitDailyViewRow[]> {
  const db = getServiceSupabase();

  assertIsoDateOnlyOrThrow(args.start_date, "start_date");
  assertIsoDateOnlyOrThrow(args.end_date, "end_date");

  let q = db
    .from("vw_visit_daily_unit")
    .select("company_id,branch_id,date,unit_kerja_id,total_telling")
    .eq("company_id", args.companyId)
    .in("branch_id", args.allowedBranchIds)
    .gte("date", args.start_date)
    .lte("date", args.end_date)
    .order("date", { ascending: true });

  if (args.unit_kerja_id) q = q.eq("unit_kerja_id", args.unit_kerja_id);

  const { data, error } = await q;
  if (error) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal mengambil report harian");
  }

  return (data ?? []) as unknown as VisitDailyViewRow[];
}

export async function selectVisitMonthlyMatrixFromView(args: {
  companyId: string;
  allowedBranchIds: string[];
  month_start: string;
  month_end: string;
  unit_kerja_id?: string;
}): Promise<VisitMonthlyMatrixRow[]> {
  const db = getServiceSupabase();

  let q = db
    .from("vw_visit_monthly_matrix")
    .select("companyId,branch_id,unit_kerja_id,month,metric")
    .eq("companyId", args.companyId)
    .in("branch_id", args.allowedBranchIds)
    .gte("month", args.month_start)
    .lte("month", args.month_end)
    .order("month", { ascending: true })
    .order("unit_kerja_id", { ascending: true });

  if (args.unit_kerja_id) {
    q = q.eq("unit_kerja_id", args.unit_kerja_id);
  }

  const { data, error } = await q;
  if (error || !data) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal mengambil matrix bulanan");
  }

  return data as unknown as VisitMonthlyMatrixRow[];
}

export async function selectDailyLeadsSummaryFromView(args: {
  companyId: string;
  allowedBranchIds: string[];
  start_date: string;
  end_date: string;
  unit_kerja_id?: string;
}): Promise<DailyLeadsSummaryViewRow[]> {
  const db = getServiceSupabase();

  assertIsoDateOnlyOrThrow(args.start_date, "start_date");
  assertIsoDateOnlyOrThrow(args.end_date, "end_date");

  let q = db
    .from("vw_daily_leads_summary")
    .select("company_id,branch_id,date,unit_kerja_id,total_leads,total_won,total_lost,total_follow_up")
    .eq("company_id", args.companyId)
    .in("branch_id", args.allowedBranchIds)
    .gte("date", args.start_date)
    .lte("date", args.end_date)
    .order("date", { ascending: true });

  if (args.unit_kerja_id) q = q.eq("unit_kerja_id", args.unit_kerja_id);

  const { data, error } = await q;
  if (error) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal mengambil summary harian");
  }

  return (data ?? []) as unknown as DailyLeadsSummaryViewRow[];
}

export async function selectWeeklyLeadsSummaryFromView(args: {
  companyId: string;
  allowedBranchIds: string[];
  start_date: string;
  end_date: string;
  unit_kerja_id?: string;
}): Promise<WeeklyLeadsSummaryViewRow[]> {
  const db = getServiceSupabase();

  assertIsoDateOnlyOrThrow(args.start_date, "start_date");
  assertIsoDateOnlyOrThrow(args.end_date, "end_date");

  let q = db
    .from("vw_weekly_leads_summary")
    .select("company_id,branch_id,week_start,unit_kerja_id,total_leads,total_estimated_value")
    .eq("company_id", args.companyId)
    .in("branch_id", args.allowedBranchIds)
    .gte("week_start", args.start_date)
    .lte("week_start", args.end_date)
    .order("week_start", { ascending: true });

  if (args.unit_kerja_id) q = q.eq("unit_kerja_id", args.unit_kerja_id);

  const { data, error } = await q;
  if (error) {
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal mengambil summary mingguan");
  }

  return (data ?? []) as unknown as WeeklyLeadsSummaryViewRow[];
}
