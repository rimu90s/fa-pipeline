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
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50)

    let query = supabase
      .from('teams')
      .select('id, branch_id, name, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    if (ctx.scopeLevel !== 'company' && ctx.allowedBranchIds.length > 0) {
      query = query.in('branch_id', ctx.allowedBranchIds)
    }

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error } = await query
    if (error) return fail(500, 'DB_READ_FAILED', 'Gagal memuat data.')

    return ok(data, { q, limit })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'USER_NOT_MAPPED') return fail(403, 'USER_NOT_MAPPED', 'User belum terdaftar.')
    if (msg === 'ROLE_NOT_FOUND') return fail(403, 'ROLE_NOT_FOUND', 'Role belum di-assign.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await resolveAuthContext()
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const branchId = toStr(body.branch_id).trim()

    if (!name) return fail(422, 'VALIDATION', 'Nama team wajib diisi.')
    if (!branchId) return fail(422, 'VALIDATION', 'branch_id wajib diisi.')

    const svc = createSupabaseServiceClient()
    const { data, error } = await svc
      .from('teams')
      .insert({
        company_id: ctx.companyId,
        branch_id: branchId,
        name,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.log('TEAM_INSERT_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat team.')
    }

    await writeAuditLog({
      action: 'MASTER_TEAM_CREATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'teams',
      entityId: data.id,
      metadata: { name },
    })

    return ok({ id: data.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}
