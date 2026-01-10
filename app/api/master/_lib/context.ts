// context.ts
// Auth & tenant context resolver
// STEP 1: only resolve authenticated user (no role, no company yet)

import { createSupabaseServerClient } from './supabase.server'

export type ScopeLevel = 'company' | 'branch' | 'unit'

export type AuthContext = {
  userId: string
  companyId: string
  allowedBranchIds: string[]
  scopeLevel: ScopeLevel
  roles: string[]
}

export async function resolveAuthContext(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient()

  const { data: userRes, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userRes?.user) throw new Error('UNAUTHENTICATED')

  const userId = userRes.user.id

  // 1) Load public.users (identity: auth.uid() = public.users.id)
  const { data: u, error: uErr } = await supabase
    .from('users')
    .select('id, company_id')
    .eq('id', userId)
    .single()

  if (uErr || !u?.company_id) throw new Error('USER_NOT_MAPPED')

  const companyId = u.company_id as string

  // 2) Load roles + scope from user_roles
  const { data: roles, error: rErr } = await supabase
    .from('user_roles')
    .select('role, scope_level, branch_id')
    .eq('user_id', userId)
    .eq('company_id', companyId)

  if (rErr || !roles || roles.length === 0) throw new Error('ROLE_NOT_FOUND')

  const scopeLevel = (roles[0].scope_level as ScopeLevel) ?? 'branch'
  const roleNames = roles.map((x: { role: unknown }) => String(x.role))

  // allowedBranchIds:
  // - if company scope: empty array means "all branches allowed" (enforced later by query builder)
  // - else: collect branch_id values
  const allowedBranchIds =
    scopeLevel === 'company'
      ? []
      : roles
        .map((x: { branch_id: unknown }) => String(x.branch_id))
        .filter((v: string) => v && v !== 'null' && v !== 'undefined')


  return { userId, companyId, allowedBranchIds, scopeLevel, roles: roleNames }
}

