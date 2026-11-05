import { describe, expect, it } from 'vitest'
import {
  createSocialPostSchema,
  listSocialPostsQuerySchema,
  parseScheduledFor,
  resolveListRange,
  updateSocialPostSchema,
} from '@/lib/social/posts/schema'

describe('social post schemas', () => {
  it('applies defaults and rejects unknown fields', () => {
    const ok = createSocialPostSchema.safeParse({ templateId: 'vrat', scheduledFor: '2026-11-20' })
    expect(ok.success && ok.data).toMatchObject({ format: '4x5', status: 'idea', caption: '', params: {} })
    expect(createSocialPostSchema.safeParse({ templateId: 'vrat', scheduledFor: '2026-11-20', createdBy: 'x' }).success).toBe(false)
    expect(createSocialPostSchema.safeParse({ templateId: 'vrat', scheduledFor: 'tomorrow' }).success).toBe(false)
    expect(createSocialPostSchema.safeParse({ templateId: 'vrat', scheduledFor: '2026-11-20', caption: 'x'.repeat(2201) }).success).toBe(false)
  })

  it('requires at least one field on update', () => {
    expect(updateSocialPostSchema.safeParse({}).success).toBe(false)
    expect(updateSocialPostSchema.safeParse({ notes: null }).success).toBe(true)
  })

  it('reads date-only scheduledFor as the IST day start', () => {
    expect(parseScheduledFor('2026-11-20')?.toISOString()).toBe('2026-11-19T18:30:00.000Z')
  })

  it('resolves month and from/to ranges on IST boundaries', () => {
    const m = listSocialPostsQuerySchema.parse({ month: '2026-12' })
    expect(resolveListRange(m)).toEqual({
      start: new Date('2026-11-30T18:30:00.000Z'),
      end: new Date('2026-12-31T18:30:00.000Z'),
    })
    const r = listSocialPostsQuerySchema.parse({ from: '2026-11-01', to: '2026-11-07', status: 'ready' })
    expect(resolveListRange(r)).toEqual({
      start: new Date('2026-10-31T18:30:00.000Z'),
      end: new Date('2026-11-07T18:30:00.000Z'),
    })
    expect(listSocialPostsQuerySchema.safeParse({ month: '2026-11', from: '2026-11-01', to: '2026-11-02' }).success).toBe(false)
    expect(listSocialPostsQuerySchema.safeParse({ from: '2026-11-01' }).success).toBe(false)
    expect('error' in resolveListRange(listSocialPostsQuerySchema.parse({ from: '2026-11-05', to: '2026-11-01' }))).toBe(true)
  })
})
