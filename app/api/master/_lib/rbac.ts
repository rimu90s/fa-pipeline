// rbac.ts
// Role & scope guard utilities
// Logic will be implemented step by step

import type { AuthContext } from './context'

export type UserRole = 'COMPANY_ADMIN' | 'BRANCH_MANAGER' | 'FA' | 'VIEWER'

export function hasRole(ctx: AuthContext, role: UserRole) {
  return ctx.roles.includes(role)
}

export function requireAnyRole(ctx: AuthContext, roles: UserRole[]) {
  const ok = roles.some((r) => hasRole(ctx, r))
  if (!ok) throw new Error('FORBIDDEN')
}
