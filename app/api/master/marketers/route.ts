import { ok, fail } from '../_lib/response'
import { resolveAuthContext } from '../_lib/context'
import { requireAnyRole } from '../_lib/rbac'
import { createSupabaseServerClient } from '../_lib/supabase.server'
import { createSupabaseServiceClient } from '../_lib/supabase.service'
import { writeAuditLog } from '../_lib/audit'

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

async function resolveTargetBranchId(ctx: AuthCtx, body: Record<string, unknown>) {
  const branchFromBody = toStr(body.branch_id).trim()

  if (ctx.scopeLevel === 'company') {
    if (!branchFromBody) return { ok: false as const, error: fail(422, 'VALIDATION', 'branch_id wajib diisi untuk scope company.') }
    return { ok: true as const, branchId: branchFromBody }
  }

  if (branchFromBody) {
    if (!ctx.allowedBranchIds.includes(branchFromBody)) {
      return { ok: false as const, error: fail(403, 'FORBIDDEN', 'branch_id di luar scope Anda.') }
    }
    return { ok: true as const, branchId: branchFromBody }
  }

  if (ctx.allowedBranchIds.length === 1) return { ok: true as const, branchId: ctx.allowedBranchIds[0] }
  return { ok: false as const, error: fail(422, 'VALIDATION', 'branch_id wajib diisi (scope Anda punya banyak branch).') }
}

export async function GET(request: Request) {
  try {
    const ctx = (await resolveAuthContext()) as unknown as AuthCtx
    const supabase = await createSupabaseServerClient()

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50)

    let query = supabase
      .from('marketers')
      .select('id, branch_id, name, user_id, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    if (ctx.scopeLevel !== 'company' && ctx.allowedBranchIds.length > 0) {
      query = query.in('branch_id', ctx.allowedBranchIds)
    }

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error } = await query
    if (error) {
      console.log('MARKETERS_READ_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_READ_FAILED', 'Gagal memuat data.')
    }

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
    const ctx = (await resolveAuthContext()) as unknown as AuthCtx
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const userId = toStr(body.user_id).trim() || null

    if (!name) return fail(422, 'VALIDATION', 'Nama marketer wajib diisi.')
    if (userId && !isUuid(userId)) return fail(422, 'VALIDATION', 'user_id tidak valid.')

    const target = await resolveTargetBranchId(ctx, body)
    if (!target.ok) return target.error
    const branchId = target.branchId

    const svc = createSupabaseServiceClient()

    // Optional validation: if user_id set, must exist in public.users and same company
    if (userId) {
      const u = await svc.from('users').select('id, company_id').eq('id', userId).limit(1)
      if (u.error || !u.data || u.data.length === 0) return fail(422, 'VALIDATION', 'user_id tidak ditemukan.')
      if (u.data[0].company_id !== ctx.companyId) return fail(422, 'VALIDATION', 'user_id bukan dalam company ini.')
    }

    const { data, error } = await svc
      .from('marketers')
      .insert({
        company_id: ctx.companyId,
        branch_id: branchId,
        name,
        user_id: userId,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.log('MARKETER_INSERT_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat marketer.')
    }

    await writeAuditLog({
      action: 'MASTER_MARKETER_CREATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'marketers',
      entityId: data.id,
      metadata: { name, user_id: userId ? 'set' : 'empty' },
    })

    return ok({ id: data.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}
