// audit.ts
// Audit log writer
// All write actions must go through this utility
// Logic will be implemented step by step

import { createSupabaseServiceClient } from './supabase.service'

export type AuditAction =
    | 'LOGIN'
    | 'VISIT_EVENT_CREATE'
    | 'VISIT_EVENT_UPDATE'
    | 'VISIT_EVENT_DELETE'
    | 'REPORT_EXPORT'
    | 'MASTER_BRANCH_CREATE'
    | 'MASTER_BRANCH_UPDATE'
    | 'MASTER_BRANCH_DELETE'
    | 'MASTER_BRANCH_UNIT_CREATE'
    | 'MASTER_BRANCH_UNIT_UPDATE'
    | 'MASTER_BRANCH_UNIT_DELETE'
    | 'MASTER_TEAM_CREATE'
    | 'MASTER_TEAM_UPDATE'
    | 'MASTER_TEAM_DELETE'
    | 'MASTER_WORK_UNIT_CREATE'
    | 'MASTER_WORK_UNIT_UPDATE'
    | 'MASTER_WORK_UNIT_DELETE'
    | 'MASTER_PRODUCT_CREATE'
    | 'MASTER_PRODUCT_UPDATE'
    | 'MASTER_PRODUCT_DELETE'
    | 'MASTER_CUSTOMER_CREATE'
    | 'MASTER_CUSTOMER_UPDATE'
    | 'MASTER_CUSTOMER_DELETE'
    | 'MASTER_MARKETER_CREATE'
    | 'MASTER_MARKETER_UPDATE'
    | 'MASTER_MARKETER_DELETE'

export async function writeAuditLog(input: {
  action: AuditAction
  companyId: string
  branchId?: string | null
  actorUserId: string
  entityTable: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}) {
  const svc = createSupabaseServiceClient()

  const { error } = await svc.from('audit_logs').insert({
    action: input.action,
    company_id: input.companyId,
    branch_id: input.branchId ?? null,
    actor_user_id: input.actorUserId,
    entity_table: input.entityTable,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  })

    if (error) {
        console.log('AUDIT_INSERT_ERROR:', JSON.stringify(error, null, 2))
        throw new Error('AUDIT_WRITE_FAILED')
    }
}
