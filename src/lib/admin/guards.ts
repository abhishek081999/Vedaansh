export function canChangeUserRole(params: {
  actorId: string
  targetId: string
  targetCurrentRole: 'user' | 'admin'
  newRole: 'user' | 'admin'
  adminCount: number
}): { ok: true } | { ok: false; error: string } {
  if (params.newRole === 'user' && params.targetId === params.actorId) {
    return { ok: false, error: 'Cannot demote your own admin role' }
  }
  if (
    params.newRole === 'user' &&
    params.targetCurrentRole === 'admin' &&
    params.adminCount <= 1
  ) {
    return { ok: false, error: 'Cannot remove the last admin' }
  }
  return { ok: true }
}

export function findDuplicateCouponCodes(codes: string[]): string | null {
  const seen = new Set<string>()
  for (const raw of codes) {
    const code = raw.trim().toUpperCase()
    if (!code) continue
    if (seen.has(code)) return code
    seen.add(code)
  }
  return null
}
