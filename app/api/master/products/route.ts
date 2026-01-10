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
function toBool(v: unknown, def = true) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  return def
}

function resolveReadableBranchFilter(ctx: AuthCtx) {
  // company scope: can see all products in company (including branch-specific & global)
  if (ctx.scopeLevel === 'company') return { mode: 'all' as const }

  // branch/unit scope: only global (branch_id null) or branch_id in allowed
  return { mode: 'limited' as const, allowed: ctx.allowedBranchIds }
}

export async function GET(request: Request) {
  try {
    const ctx = (await resolveAuthContext()) as unknown as AuthCtx
    const supabase = await createSupabaseServerClient()

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50)

    let query = supabase
      .from('products')
      .select('id, branch_id, name, sku, is_active, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    const bf = resolveReadableBranchFilter(ctx)
    if (bf.mode === 'limited') {
      // WHERE (branch_id IS NULL OR branch_id in allowed)
      query = query.or(`branch_id.is.null,branch_id.in.(${bf.allowed.join(',')})`)
    }

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error } = await query
    if (error) {
      console.log('PRODUCTS_READ_ERROR:', JSON.stringify(error, null, 2))
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
    // CRUD: COMPANY_ADMIN (BRANCH_MANAGER optional; for now keep strict)
    requireAnyRole(ctx, ['COMPANY_ADMIN'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const sku = toStr(body.sku).trim() || null
    const isActive = toBool(body.is_active, true)
    const branchId = toStr(body.branch_id).trim() || null // null = company-wide

    if (!name) return fail(422, 'VALIDATION', 'Nama product wajib diisi.')

    // if branch_id set, must be within company (and if non-company scope, must be allowed)
    if (branchId) {
      if (ctx.scopeLevel !== 'company' && !ctx.allowedBranchIds.includes(branchId)) {
        return fail(403, 'FORBIDDEN', 'branch_id di luar scope Anda.')
      }
    }

    const svc = createSupabaseServiceClient()
    const { data, error } = await svc
      .from('products')
      .insert({
        company_id: ctx.companyId,
        branch_id: branchId,
        name,
        sku,
        is_active: isActive,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.log('PRODUCT_INSERT_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat product.')
    }

    await writeAuditLog({
      action: 'MASTER_PRODUCT_CREATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'products',
      entityId: data.id,
      metadata: { name, sku, branch_id: branchId },
    })

    return ok({ id: data.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}
