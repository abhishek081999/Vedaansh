import { describe, expect, it } from 'vitest'
import { buildUserMatchStage, formatUserSummary } from '@/lib/admin/users-query'

describe('buildUserMatchStage', () => {
  it('builds search regex filter', () => {
    expect(buildUserMatchStage({ search: 'alice' })).toEqual({
      $or: [{ name: { $regex: 'alice', $options: 'i' } }, { email: { $regex: 'alice', $options: 'i' } }],
    })
  })

  it('combines role and plan filters', () => {
    expect(buildUserMatchStage({ role: 'admin', plan: 'gold' })).toEqual({
      role: 'admin',
      plan: 'gold',
    })
  })
})

describe('formatUserSummary', () => {
  it('formats facet summary counts', () => {
    expect(formatUserSummary({
      metadata: [{ total: 10 }],
      admins: [{ count: 2 }],
      summary: [
        { _id: 'free', count: 5 },
        { _id: 'gold', count: 3 },
        { _id: 'platinum', count: 2 },
      ],
    })).toEqual({
      total: 10,
      admins: 2,
      byEffectivePlan: { free: 5, gold: 3, platinum: 2 },
    })
  })
})
