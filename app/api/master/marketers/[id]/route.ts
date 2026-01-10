import { ok, fail } from '../../_lib/response'
import { resolveAuthContext } from '../../_lib/context'
import { requireAnyRole } from '../../_lib/rbac'
import { createSupabaseServiceClient } from '../../_lib/supabase.service'
import { writeAuditLog } from '../../_lib/audit'

type AuthCtx = {
  userId: string
  companyId: string
  scopeLevel: 'company' | 'branch' | 'unit'
  allowedBranchIds: string[]
  roles: string[]
}

function toStr(v: unknown) {
  return typeof v === 'string' ? v : ''
}
function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export async function PUT(
  request: Request,
  ctxRoute: { params: Promise<{ id: string }> }
) {
  const { id } = await ctxRoute.params

  try {
    const ctx = (await resolveAuthContext()) as unknown as AuthCtx
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const userId = toStr(body.user_id).trim() || null

    if (!name) return fail(422, 'VALIDATION', 'Nama marketer wajib diisi.')
    if (userId && !isUuid(userId)) return fail(422, 'VALIDATION', 'user_id tidak valid.')

    const svc = createSupabaseServiceClient()

    if (userId) {
      const u = await svc.from('users').select('id, company_id').eq('id', userId).limit(1)
      if (u.error || !u.data || u.data.length === 0) return fail(422, 'VALIDATION', 'user_id tidak ditemukan.')
      if (u.data[0].company_id !== ctx.companyId) return fail(422, 'VALIDATION', 'user_id bukan dalam company ini.')
    }

    const res = await svc
      .from('marketers')
      .update({
        name,
        user_id: userId,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      })
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select('id, branch_id')

    if (res.error) {
      console.log('MARKETER_UPDATE_ERROR:', JSON.stringify(res.error, null, 2))
      return fail(500, 'DB_UPDATE_FAILED', 'Gagal update marketer.')
    }

    if (!res.data || res.data.length === 0) {
      return fail(404, 'NOT_FOUND', 'Marketer tidak ditemukan.')
    }

    await writeAuditLog({
      action: 'MASTER_MARKETER_UPDATE',
      companyId: ctx.companyId,
      branchId: res.data[0].branch_id,
      actorUserId: ctx.userId,
      entityTable: 'marketers',
      entityId: id,
      metadata: { name, user_id: userId ? 'set' : 'empty' },
    })

    return ok({ id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}

export async function DELETE(
  _request: Request,
  ctxRoute: { params: Promise<{ id: string }> }
) {
  const { id } = await ctxRoute.params

  try {
    const ctx = (await resolveAuthContext()) as unknown as AuthCtx
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const svc = createSupabaseServiceClient()
    const res = await svc
      .from('marketers')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select('id, branch_id')

    if (res.error) {
      console.log('MARKETER_DELETE_ERROR:', JSON.stringify(res.error, null, 2))
      return fail(500, 'DB_DELETE_FAILED', 'Gagal menghapus marketer.')
    }

    if (!res.data || res.data.length === 0) {
      return fail(404, 'NOT_FOUND', 'Marketer tidak ditemukan.')
    }

    await writeAuditLog({
      action: 'MASTER_MARKETER_DELETE',
      companyId: ctx.companyId,
      branchId: res.data[0].branch_id,
      actorUserId: ctx.userId,
      entityTable: 'marketers',
      entityId: id,
      metadata: {},
    })

    return ok({ id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}
