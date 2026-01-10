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

function normalizePhone(raw: string) {
  // hapus spasi, +, -, (), dll -> hanya digit
  const digits = raw.replace(/[^\d]/g, '')
  return digits.length > 0 ? digits : null
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
      .from('customers')
      .select('id, branch_id, name, phone, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    if (ctx.scopeLevel !== 'company' && ctx.allowedBranchIds.length > 0) {
      query = query.in('branch_id', ctx.allowedBranchIds)
    }

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error } = await query
    if (error) {
      console.log('CUSTOMERS_READ_ERROR:', JSON.stringify(error, null, 2))
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
    // CRUD: COMPANY_ADMIN, BRANCH_MANAGER; FA create opsional -> untuk sekarang kita ikut matrix: allow FA create
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER', 'FA'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const phone = toStr(body.phone).trim() || null
    const phoneNorm = phone ? normalizePhone(phone) : null

    if (!name) return fail(422, 'VALIDATION', 'Nama nasabah wajib diisi.')

    const target = await resolveTargetBranchId(ctx, body)
    if (!target.ok) return target.error
    const branchId = target.branchId

    const svc = createSupabaseServiceClient()

    // DEDUP check: lower(name) + phoneNorm within company+branch
    if (phoneNorm) {
      const dup = await svc
        .from('customers')
        .select('id')
        .eq('company_id', ctx.companyId)
        .eq('branch_id', branchId)
        .ilike('name', name) // case-insensitive
        .eq('phone_norm', phoneNorm)
        .limit(1)

      if (!dup.error && dup.data && dup.data.length > 0) {
        return fail(409, 'DUPLICATE', 'Nasabah sudah ada (nama & telepon sama).')
      }
    }

    const { data, error } = await svc
      .from('customers')
      .insert({
        company_id: ctx.companyId,
        branch_id: branchId,
        name,
        phone,
        phone_norm: phoneNorm,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.log('CUSTOMER_INSERT_ERROR:', JSON.stringify(error, null, 2))
      // jika race condition kena unique index
      if (error && 'code' in error && (error as { code?: string }).code === '23505') {
          return fail(409, 'DUPLICATE', 'Nasabah sudah ada (nama & telepon sama).')
        }
      return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat nasabah.')
    }

    await writeAuditLog({
      action: 'MASTER_CUSTOMER_CREATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'customers',
      entityId: data.id,
      metadata: { name, phone: phoneNorm ? 'set' : 'empty' },
    })

    return ok({ id: data.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}
