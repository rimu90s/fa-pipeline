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
function toBool(v: unknown, def = true) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  return def
}

export async function PUT(
  request: Request,
  ctxRoute: { params: Promise<{ id: string }> }
) {
  const { id } = await ctxRoute.params

  try {
    const ctx = (await resolveAuthContext()) as unknown as AuthCtx
    requireAnyRole(ctx, ['COMPANY_ADMIN'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const sku = toStr(body.sku).trim() || null
    const isActive = toBool(body.is_active, true)
    const branchId = toStr(body.branch_id).trim() || null

    if (!name) return fail(422, 'VALIDATION', 'Nama product wajib diisi.')

    if (branchId) {
      if (ctx.scopeLevel !== 'company' && !ctx.allowedBranchIds.includes(branchId)) {
        return fail(403, 'FORBIDDEN', 'branch_id di luar scope Anda.')
      }
    }

    const svc = createSupabaseServiceClient()
    const res = await svc
      .from('products')
      .update({
        branch_id: branchId,
        name,
        sku,
        is_active: isActive,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      })
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select('id')

    if (res.error) {
      console.log('PRODUCT_UPDATE_ERROR:', JSON.stringify(res.error, null, 2))
      return fail(500, 'DB_UPDATE_FAILED', 'Gagal update product.')
    }

    if (!res.data || res.data.length === 0) {
      return fail(404, 'NOT_FOUND', 'Product tidak ditemukan.')
    }

    await writeAuditLog({
      action: 'MASTER_PRODUCT_UPDATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'products',
      entityId: id,
      metadata: { name, sku, branch_id: branchId },
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
    requireAnyRole(ctx, ['COMPANY_ADMIN'])

    const svc = createSupabaseServiceClient()
    const { error } = await svc
      .from('products')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.companyId)

    if (error) {
      console.log('PRODUCT_DELETE_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_DELETE_FAILED', 'Gagal menghapus product.')
    }

    await writeAuditLog({
      action: 'MASTER_PRODUCT_DELETE',
      companyId: ctx.companyId,
      branchId: null,
      actorUserId: ctx.userId,
      entityTable: 'products',
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
