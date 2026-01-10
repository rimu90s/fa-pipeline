// app/api/master/_debug/route.ts
// DEBUG ROUTE (READ-ONLY)
// Logic will be added step by step

import { ok, fail } from '../_lib/response'
import { resolveAuthContext } from '../_lib/context'
import { requireAnyRole } from '../_lib/rbac'
import { writeAuditLog } from '../_lib/audit'

export async function GET() {
  try {
    const ctx = await resolveAuthContext()

    return ok({
      userId: ctx.userId,
      companyId: ctx.companyId,
      scopeLevel: ctx.scopeLevel,
      allowedBranchIdsCount: ctx.allowedBranchIds.length,
      roles: ctx.roles,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'USER_NOT_MAPPED') return fail(403, 'USER_NOT_MAPPED', 'User belum terdaftar di sistem.')
    if (msg === 'ROLE_NOT_FOUND') return fail(403, 'ROLE_NOT_FOUND', 'Role belum di-assign.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan. Coba lagi.')
  }
}

export async function POST(request: Request) {
  // READ-ONLY test: echo payload vs resolved context (no DB write)
  const body = await request.json().catch(() => ({}))

  try {
    const ctx = await resolveAuthContext()
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    await writeAuditLog({
      action: 'LOGIN',
      companyId: ctx.companyId,
      branchId: null,
      actorUserId: ctx.userId,
      entityTable: 'debug_guardrail',
      entityId: null,
      metadata: { test: 'phase0', note: 'audit from debug POST' },
    })

    return ok({
      receivedPayload: body,
      resolved: {
        userId: ctx.userId,
        companyId: ctx.companyId,
        scopeLevel: ctx.scopeLevel,
      },
      note: 'Server ignores client company_id/branch_id; context is server-resolved.',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('DEBUG_POST_ERROR:', e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Anda tidak punya akses untuk aksi ini.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan. Coba lagi.')
  }
}

