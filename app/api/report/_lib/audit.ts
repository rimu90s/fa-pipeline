// app/api/report/_lib/audit.ts
import { HttpError } from "./errors";
import { getServiceSupabase } from "./supabase";

export type WriteAuditLogArgs = {
  action: string;

  companyId: string;
  branchId: string | null;
  actorUserId: string;

  entityTable: string;
  entityId: string | null;

  metadata: unknown;
};

/**
 * FINAL AUDIT HELPER (DIKUNCI)
 *
 * - Table: audit_logs
 * - Columns:
 *   company_id
 *   branch_id
 *   actor_user_id
 *   action
 *   entity_table
 *   entity_id
 *   metadata
 *   created_at (DB default)
 *
 * - Wajib HARD FAIL jika insert gagal
 * - Dipakai oleh SEMUA module (master, report, export, dll)
 */
export async function writeAuditLog(args: WriteAuditLogArgs): Promise<void> {
  const db = getServiceSupabase();

  const { error } = await db.from("audit_logs").insert({
    company_id: args.companyId,
    branch_id: args.branchId,
    actor_user_id: args.actorUserId,
    action: args.action,
    entity_table: args.entityTable,
    entity_id: args.entityId,
    metadata: args.metadata,
  });

  if (error) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Gagal menulis audit log"
    );
  }
}
