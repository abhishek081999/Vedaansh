// ─────────────────────────────────────────────────────────────
//  src/lib/ui/dignityScale.ts
//  Ordinal dignity scale (0 = debilitated … 8 = exalted) for meters
// ─────────────────────────────────────────────────────────────

export const DIGNITY_RANK: Record<string, number> = {
  debilitated: 0,
  great_enemy: 1,
  enemy: 2,
  neutral: 3,
  friend: 4,
  great_friend: 5,
  own: 6,
  moolatrikona: 7,
  exalted: 8,
}

export const DIGNITY_MAX = 8

export function dignityRank(dignity: string | undefined | null): number | null {
  if (!dignity) return null
  return DIGNITY_RANK[dignity] ?? null
}
