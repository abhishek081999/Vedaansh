import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/mongodb', () => ({ default: vi.fn() }))
vi.mock('@/lib/db/models/User', () => ({
  User: {
    find: vi.fn(),
  },
}))

import { User } from '@/lib/db/models/User'
import { buildChartSearchFilter } from '@/lib/admin/chart-search'

describe('buildChartSearchFilter', () => {
  beforeEach(() => {
    vi.mocked(User.find).mockReset()
  })

  it('returns empty filter for blank search', async () => {
    expect(await buildChartSearchFilter('')).toEqual({})
    expect(await buildChartSearchFilter('   ')).toEqual({})
    expect(User.find).not.toHaveBeenCalled()
  })

  it('includes owner user ids when email matches', async () => {
    const userId = '507f1f77bcf86cd799439011'
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: async () => [{ _id: userId }],
      }),
    } as never)

    const filter = await buildChartSearchFilter('alice@example.com')
    expect(filter).toEqual({
      $or: [
        { name: { $regex: 'alice@example\\.com', $options: 'i' } },
        { birthPlace: { $regex: 'alice@example\\.com', $options: 'i' } },
        { userId: { $in: [userId] } },
      ],
    })
  })

  it('searches chart fields only when no owners match', async () => {
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: async () => [],
      }),
    } as never)

    const filter = await buildChartSearchFilter('Mumbai')
    expect(filter).toEqual({
      $or: [
        { name: { $regex: 'Mumbai', $options: 'i' } },
        { birthPlace: { $regex: 'Mumbai', $options: 'i' } },
      ],
    })
  })
})
