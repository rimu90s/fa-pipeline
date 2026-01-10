import { ok, fail } from '../../_lib/response'
import { resolveAuthContext } from '../../_lib/context'
import { requireAnyRole } from '../../_lib/rbac'
import { createSupabaseServiceClient } from '../../_lib/supabase.service'
import { writeAuditLog } from '../../_lib/audit'

function toStr(v: unknown) {
  return typeof v === 'string' ? v : ''
}

export async function PUT(
  request: Request,
  ctxRoute: { params: Promise<{ id: string }> }
) {
  const { id } = await ctxRoute.params

  try {
    const ctx = await resolveAuthContext()
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()

    if (!name) return fail(422, 'VALIDATION', 'Nama unit wajib diisi.')

    const svc = createSupabaseServiceClient()
    const res = await svc
      .from('branch_units')
      .update({
        name,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      })
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select('id')

    if (res.error) {
      console.log('BRANCH_UNIT_UPDATE_ERROR:', JSON.stringify(res.error, null, 2))
      return fail(500, 'DB_UPDATE_FAILED', 'Gagal update branch unit.')
    }

    if (!res.data || res.data.length === 0) {
      return fail(404, 'NOT_FOUND', 'Branch unit tidak ditemukan.')
    }

    await writeAuditLog({
      action: 'MASTER_BRANCH_UNIT_UPDATE',
      companyId: ctx.companyId,
      branchId: null,
      actorUserId: ctx.userId,
      entityTable: 'branch_units',
      entityId: id,
      metadata: { name },
    })

    return ok({ id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Anda tidak punya akses untuk aksi ini.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan. Coba lagi.')
  }
}

export async function DELETE(
  _request: Request,
  ctxRoute: { params: Promise<{ id: string }> }
) {
  const { id } = await ctxRoute.params

  try {
    const ctx = await resolveAuthContext()
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const svc = createSupabaseServiceClient()
    const { error } = await svc
      .from('branch_units')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.companyId)

    if (error) {
      console.log('BRANCH_UNIT_DELETE_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_DELETE_FAILED', 'Gagal menghapus branch unit.')
    }

    await writeAuditLog({
      action: 'MASTER_BRANCH_UNIT_DELETE',
      companyId: ctx.companyId,
      branchId: null,
      actorUserId: ctx.userId,
      entityTable: 'branch_units',
      entityId: id,
      metadata: {},
    })

    return ok({ id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Anda tidak punya akses untuk aksi ini.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan. Coba lagi.')
  }
}
