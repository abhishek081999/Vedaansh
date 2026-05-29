import { describe, expect, it } from 'vitest'
import { parsePaginationParams, paginationMeta } from '@/lib/admin/pagination'
import { canChangeUserRole, findDuplicateCouponCodes } from '@/lib/admin/guards'

describe('parsePaginationParams', () => {
  it('parses page, limit, and search', () => {
    const params = new URLSearchParams('page=2&limit=25&search=alice')
    expect(parsePaginationParams(params)).toEqual({
      page: 2,
      limit: 25,
      search: 'alice',
      skip: 25,
    })
  })

  it('clamps limit to 100 and defaults page to 1', () => {
    const params = new URLSearchParams('page=0&limit=500')
    expect(parsePaginationParams(params)).toEqual({
      page: 1,
      limit: 100,
      search: '',
      skip: 0,
    })
  })
})

describe('paginationMeta', () => {
  it('computes total pages', () => {
    expect(paginationMeta(1, 50, 120)).toEqual({
      page: 1,
      limit: 50,
      total: 120,
      totalPages: 3,
    })
  })
})

describe('canChangeUserRole', () => {
  it('blocks self-demotion', () => {
    const result = canChangeUserRole({
      actorId: 'a1',
      targetId: 'a1',
      targetCurrentRole: 'admin',
      newRole: 'user',
      adminCount: 2,
    })
    expect(result.ok).toBe(false)
  })

  it('blocks removing the last admin', () => {
    const result = canChangeUserRole({
      actorId: 'a1',
      targetId: 'a2',
      targetCurrentRole: 'admin',
      newRole: 'user',
      adminCount: 1,
    })
    expect(result.ok).toBe(false)
  })

  it('allows promoting a user', () => {
    const result = canChangeUserRole({
      actorId: 'a1',
      targetId: 'u1',
      targetCurrentRole: 'user',
      newRole: 'admin',
      adminCount: 1,
    })
    expect(result.ok).toBe(true)
  })
})

describe('findDuplicateCouponCodes', () => {
  it('returns duplicate code', () => {
    expect(findDuplicateCouponCodes(['SAVE10', 'save10', 'NEW'])).toBe('SAVE10')
  })

  it('returns null when unique', () => {
    expect(findDuplicateCouponCodes(['A', 'B', 'C'])).toBeNull()
  })
})
