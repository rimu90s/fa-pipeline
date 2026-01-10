import { ok, fail } from '../_lib/response'
import { resolveAuthContext } from '../_lib/context'
import { requireAnyRole } from '../_lib/rbac'
import { createSupabaseServerClient } from '../_lib/supabase.server'
import { createSupabaseServiceClient } from '../_lib/supabase.service'
import { writeAuditLog } from '../_lib/audit'

function toStr(v: unknown) {
  return typeof v === 'string' ? v : ''
}

export async function GET(request: Request) {
  try {
    const ctx = await resolveAuthContext()
    const supabase = await createSupabaseServerClient()

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const limitRaw = Number(url.searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20

    // branch-scoped read:
    // - company scope: can read all branches in company
    // - branch scope: limited by allowedBranchIds
    let query = supabase
      .from('branch_units')
      .select('id, branch_id, name, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    if (ctx.scopeLevel !== 'company' && ctx.allowedBranchIds.length > 0) {
      query = query.in('branch_id', ctx.allowedBranchIds)
    }

    if (q.length > 0) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      console.log('BRANCH_UNITS_READ_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_READ_FAILED', 'Gagal memuat data.')
    }

    return ok(data, { limit, q })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'USER_NOT_MAPPED') return fail(403, 'USER_NOT_MAPPED', 'User belum terdaftar di sistem.')
    if (msg === 'ROLE_NOT_FOUND') return fail(403, 'ROLE_NOT_FOUND', 'Role belum di-assign.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan. Coba lagi.')
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await resolveAuthContext()
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const branchId = toStr(body.branch_id).trim()

    if (!name) return fail(422, 'VALIDATION', 'Nama unit wajib diisi.')
    if (!branchId) return fail(422, 'VALIDATION', 'branch_id wajib diisi.')

    // WRITE via service role; server enforces tenant
    const svc = createSupabaseServiceClient()
    const { data, error } = await svc
      .from('branch_units')
      .insert({
        company_id: ctx.companyId,
        branch_id: branchId,
        name,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.log('BRANCH_UNIT_INSERT_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat branch unit.')
    }

    await writeAuditLog({
      action: 'MASTER_BRANCH_UNIT_CREATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'branch_units',
      entityId: data.id,
      metadata: { name },
    })

    return ok({ id: data.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Anda tidak punya akses untuk aksi ini.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan. Coba lagi.')
  }
}
