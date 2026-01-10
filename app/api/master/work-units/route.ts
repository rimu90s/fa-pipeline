import { ok, fail } from '../_lib/response'
import { resolveAuthContext } from '../_lib/context'
import { requireAnyRole } from '../_lib/rbac'
import { createSupabaseServerClient } from '../_lib/supabase.server'
import { createSupabaseServiceClient } from '../_lib/supabase.service'
import { writeAuditLog } from '../_lib/audit'

type SourceType = 'KCU' | 'KCP' | 'TEAM' | 'INTERNAL' | 'BANK' | 'PARTNER' | 'OTHER'

function toStr(v: unknown) {
  return typeof v === 'string' ? v : ''
}

function isSourceType(v: string): v is SourceType {
  return ['KCU','KCP','TEAM','INTERNAL','BANK','PARTNER','OTHER'].includes(v)
}

type AuthCtx = {
  userId: string
  companyId: string
  scopeLevel: 'company' | 'branch' | 'unit'
  allowedBranchIds: string[]
}

async function resolveTargetBranchId(ctx: AuthCtx, body: Record<string, unknown>) {
  const branchFromBody = toStr(body.branch_id).trim()

  // company scope: wajib specify branch_id
  if (ctx.scopeLevel === 'company') {
    if (!branchFromBody) return { ok: false as const, error: fail(422, 'VALIDATION', 'branch_id wajib diisi untuk scope company.') }
    return { ok: true as const, branchId: branchFromBody }
  }

  // non-company: pakai allowedBranchIds
  if (branchFromBody) {
    if (!ctx.allowedBranchIds.includes(branchFromBody)) {
      return { ok: false as const, error: fail(403, 'FORBIDDEN', 'branch_id di luar scope Anda.') }
    }
    return { ok: true as const, branchId: branchFromBody }
  }

  if (ctx.allowedBranchIds.length === 1) {
    return { ok: true as const, branchId: ctx.allowedBranchIds[0] }
  }

  return { ok: false as const, error: fail(422, 'VALIDATION', 'branch_id wajib diisi (scope Anda punya banyak branch).') }
}

async function validateSourceRef(args: {
  svc: ReturnType<typeof createSupabaseServiceClient>
  companyId: string
  branchId: string
  sourceType: SourceType
  sourceId: string
}) {
  const { svc, companyId, branchId, sourceType, sourceId } = args

  if (sourceType === 'KCU') {
    // source_id harus branches.id dan harus sama dengan branch_id (tenant-safe, no dangling)
    if (sourceId !== branchId) return { ok: false as const, message: 'Untuk source_type=KCU, source_id harus sama dengan branch_id.' }
    const r = await svc.from('branches').select('id').eq('id', sourceId).eq('company_id', companyId).limit(1)
    if (r.error || !r.data || r.data.length === 0) return { ok: false as const, message: 'source_id KCU tidak valid.' }
    return { ok: true as const }
  }

  if (sourceType === 'KCP') {
    const r = await svc
      .from('branch_units')
      .select('id, branch_id')
      .eq('id', sourceId)
      .eq('company_id', companyId)
      .limit(1)
    if (r.error || !r.data || r.data.length === 0) return { ok: false as const, message: 'source_id KCP tidak valid.' }
    if (r.data[0].branch_id !== branchId) return { ok: false as const, message: 'source_id KCP tidak satu branch.' }
    return { ok: true as const }
  }

  if (sourceType === 'TEAM') {
    const r = await svc
      .from('teams')
      .select('id, branch_id')
      .eq('id', sourceId)
      .eq('company_id', companyId)
      .limit(1)
    if (r.error || !r.data || r.data.length === 0) return { ok: false as const, message: 'source_id TEAM tidak valid.' }
    if (r.data[0].branch_id !== branchId) return { ok: false as const, message: 'source_id TEAM tidak satu branch.' }
    return { ok: true as const }
  }

  // INTERNAL/BANK/PARTNER/OTHER: cukup UUID valid (existence tidak dicek)
  return { ok: true as const }
}

export async function GET(request: Request) {
  try {
    const ctx = await resolveAuthContext()
    const supabase = await createSupabaseServerClient()

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50)

    let query = supabase
      .from('work_units')
      .select('id, branch_id, name, source_type, source_id, created_at, updated_at')
      .eq('company_id', ctx.companyId)
      .order('name', { ascending: true })
      .limit(limit)

    if (ctx.scopeLevel !== 'company' && ctx.allowedBranchIds.length > 0) {
      query = query.in('branch_id', ctx.allowedBranchIds)
    }

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error } = await query
    if (error) {
      console.log('WORK_UNITS_READ_ERROR:', JSON.stringify(error, null, 2))
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
    const ctx = await resolveAuthContext()
    requireAnyRole(ctx, ['COMPANY_ADMIN', 'BRANCH_MANAGER'])

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = toStr(body.name).trim()
    const sourceTypeRaw = toStr(body.source_type).trim()
    const sourceId = toStr(body.source_id).trim()

    if (!name) return fail(422, 'VALIDATION', 'Nama unit kerja wajib diisi.')
    if (!sourceTypeRaw) return fail(422, 'VALIDATION', 'source_type wajib diisi.')
    if (!isSourceType(sourceTypeRaw)) return fail(422, 'VALIDATION', 'source_type tidak valid.')
    if (!sourceId) return fail(422, 'VALIDATION', 'source_id wajib diisi.')

    const target = await resolveTargetBranchId(ctx, body)
    if (!target.ok) return target.error
    const branchId = target.branchId

    const svc = createSupabaseServiceClient()

    const v = await validateSourceRef({
      svc,
      companyId: ctx.companyId,
      branchId,
      sourceType: sourceTypeRaw,
      sourceId,
    })
    if (!v.ok) return fail(422, 'VALIDATION', v.message)

    const { data, error } = await svc
      .from('work_units')
      .insert({
        company_id: ctx.companyId,
        branch_id: branchId,
        name,
        source_type: sourceTypeRaw,
        source_id: sourceId,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.log('WORK_UNIT_INSERT_ERROR:', JSON.stringify(error, null, 2))
      return fail(500, 'DB_WRITE_FAILED', 'Gagal membuat unit kerja.')
    }

    await writeAuditLog({
      action: 'MASTER_WORK_UNIT_CREATE',
      companyId: ctx.companyId,
      branchId,
      actorUserId: ctx.userId,
      entityTable: 'work_units',
      entityId: data.id,
      metadata: { name, source_type: sourceTypeRaw },
    })

    return ok({ id: data.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED', 'Silakan login ulang.')
    if (msg === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Tidak punya akses.')
    return fail(500, 'INTERNAL', 'Terjadi kesalahan.')
  }
}
