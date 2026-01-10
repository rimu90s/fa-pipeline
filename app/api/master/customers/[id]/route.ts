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
function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  return digits.length > 0 ? digits : null
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
    const phone = toStr(body.phone).trim() || null
    const phoneNorm = phone ? normalizePhone(phone) : null

    if (!name) return fail(422, 'VALIDATION', 'Nama nasabah wajib diisi.')

    const svc = createSupabaseServiceClient()
    const res = await svc
      .from('customers')
      .update({
        name,
        phone,
        phone_norm: phoneNorm,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      })
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select('id, branch_id')

    if (res.error) {
      console.log('CUSTOMER_UPDATE_ERROR:', JSON.stringify(res.error, null, 2))
      if (res.error && 'code' in res.error && (res.error as { code?: string }).code === '23505') {
          return fail(409, 'DUPLICATE', 'Nasabah sudah ada (nama & telepon sama).')
        }
      return fail(500, 'DB_UPDATE_FAILED', 'Gagal update nasabah.')
    }

    if (!res.data || res.data.length === 0) {
      return fail(404, 'NOT_FOUND', 'Nasabah tidak ditemukan.')
    }

    await writeAuditLog({
      action: 'MASTER_CUSTOMER_UPDATE',
      companyId: ctx.companyId,
      branchId: res.data[0].branch_id,
      actorUserId: ctx.userId,
      entityTable: 'customers',
      entityId: id,
      metadata: { name, phone: phoneNorm ? 'set' : 'empty' },
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
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select('id, branch_id')

    if (res.error) {
      console.log('CUSTOMER_DELETE_ERROR:', JSON.stringify(res.error, null, 2))
      return fail(500, 'DB_DELETE_FAILED', 'Gagal menghapus nasabah.')
    }

    // delete returns 0 row if not found
    if (!res.data || res.data.length === 0) {
      return fail(404, 'NOT_FOUND', 'Nasabah tidak ditemukan.')
    }

    await writeAuditLog({
      action: 'MASTER_CUSTOMER_DELETE',
      companyId: ctx.companyId,
      branchId: res.data[0].branch_id,
      actorUserId: ctx.userId,
      entityTable: 'customers',
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
