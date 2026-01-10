import type { SupabaseClient } from "@supabase/supabase-js";

type AuditInsert = {
  company_id: string;
  branch_id: string;
  actor_user_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  entity: string;
  entity_id: string;
  payload: unknown;
};

export async function audit(supabase: SupabaseClient, row: AuditInsert) {
  // Asumsi tabel: audit_log(company_id, branch_id, actor_user_id, action, entity, entity_id, payload, created_at)
  // Jika nama tabel berbeda, sesuaikan di sini TANPA mengubah kontrak auth/report.
  await supabase.from("audit_log").insert({
    company_id: row.company_id,
    branch_id: row.branch_id,
    actor_user_id: row.actor_user_id,
    action: row.action,
    entity: row.entity,
    entity_id: row.entity_id,
    payload: row.payload,
  });
}
