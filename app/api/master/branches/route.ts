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

    let query = supabase
      .from('branches')
      .select('id, name, code, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    if (q.length > 0) {
      // simple server-side search
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query
    if (error) return fail(500, 'DB_READ_FAILED', 'Gagal memuat data.')

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
    requireAnyRole(ctx, ['COMPANY_ADMIN'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const code = toStr(body.code).trim() || null

    if (!name) return fail(422, 'VALIDATION', 'Nama branch wajib diisi.')

    // WRITE via service role (ignore any company_id from client)
    const svc = createSupabaseServiceClient()
    const { data, error } = await svc
      .from('branches')
      .insert({
        company_id: ctx.companyId,
        name,
        code,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
  console.log('BRANCH_INSERT_ERROR:', JSON.stringify(error, null, 2))
  return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat branch.')
}


    await writeAuditLog({
      action: 'MASTER_BRANCH_CREATE',
      companyId: ctx.companyId,
      branchId: null,
      actorUserId: ctx.userId,
      entityTable: 'branches',
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
