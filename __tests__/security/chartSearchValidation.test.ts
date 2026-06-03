import { describe, expect, it } from 'vitest'
import { chartSearchQuerySchema } from '@/lib/security/validation'

describe('chartSearchQuerySchema', () => {
  it('accepts name search with empty date filter strings', () => {
    const parsed = chartSearchQuerySchema.safeParse({
      q: 'Rahul',
      gender: 'all',
      startDate: '',
      endDate: '',
      page: '1',
      limit: '24',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.q).toBe('Rahul')
      expect(parsed.data.startDate).toBeUndefined()
      expect(parsed.data.endDate).toBeUndefined()
    }
  })

  it('rejects malformed dates when provided', () => {
    const parsed = chartSearchQuerySchema.safeParse({
      startDate: 'not-a-date',
      page: '1',
    })
    expect(parsed.success).toBe(false)
  })
})
