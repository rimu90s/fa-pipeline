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
 * Table: audit_logs
 * Columns (from DB):
 * - company_id (uuid)
 * - branch_id (uuid)
 * - actor_user_id (uuid)
 * - action (USER-DEFINED / enum)
 * - entity_table (text)
 * - entity_id (uuid)
 * - diff_summary (text)
 * - metadata (jsonb)
 * - created_at (DB default)
 *
 * RULE:
 * - HARD FAIL jika insert gagal
 */
export async function writeAuditLog(args: WriteAuditLogArgs): Promise<void> {
  const db = getServiceSupabase();

  // Jika kolom entity_id/diff_summary ternyata NOT NULL, kita harus selalu isi.
  // Untuk export report, entityId boleh null pada caller,
  // tapi DB tetap perlu uuid valid agar insert tidak gagal.
  const FALLBACK_ENTITY_ID = "00000000-0000-0000-0000-000000000000";

  const payload = {
    company_id: args.companyId,
    branch_id: args.branchId,
    actor_user_id: args.actorUserId,

    // action adalah enum di DB: pastikan value yang dikirim caller memang valid enum.
    // Kita tidak memaksa mapping di sini agar tidak mengubah kontrak; kalau invalid, DB akan reject (sesuai hard-fail).
    action: args.action,

    entity_table: args.entityTable,
    entity_id: args.entityId ?? FALLBACK_ENTITY_ID,

    // diff_summary ada di schema; isi default agar tidak gagal jika NOT NULL
    diff_summary: "",

    metadata: args.metadata,
  };

  const { error } = await db.from("audit_logs").insert(payload);

  if (error) {
    console.error("[audit] insert failed:", error);
    throw new HttpError(500, "INTERNAL_ERROR", "Gagal menulis audit log");
  }
}
