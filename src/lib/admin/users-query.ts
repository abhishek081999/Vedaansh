import type { PipelineStage } from 'mongoose'
import { getEffectivePlan } from '@/lib/subscription/entitlements'

export type UserListSort = 'createdAt' | 'name' | 'plan' | 'chartCount'
export type UserListFilters = {
  search?: string
  role?: 'user' | 'admin'
  plan?: 'free' | 'gold' | 'platinum'
  effectivePlan?: 'free' | 'gold' | 'platinum'
  sort?: UserListSort
  sortDir?: 'asc' | 'desc'
  skip: number
  limit: number
}

export function buildUserMatchStage(filters: Pick<UserListFilters, 'search' | 'role' | 'plan'>) {
  const match: Record<string, unknown> = {}
  if (filters.search?.trim()) {
    const regex = { $regex: filters.search.trim(), $options: 'i' }
    match.$or = [{ name: regex }, { email: regex }]
  }
  if (filters.role) match.role = filters.role
  if (filters.plan) match.plan = filters.plan
  return match
}

export function buildUserListPipeline(filters: UserListFilters): PipelineStage[] {
  const now = new Date()
  const sortField = filters.sort || 'createdAt'
  const sortDir = filters.sortDir === 'asc' ? 1 : -1
  const sort: Record<string, 1 | -1> = { [sortField]: sortDir }
  if (sortField !== 'createdAt') sort.createdAt = -1

  const stages: PipelineStage[] = [
    { $match: buildUserMatchStage(filters) },
    {
      $lookup: {
        from: 'charts',
        localField: '_id',
        foreignField: 'userId',
        as: '_charts',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        let: { uid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$uid'] },
                  { $eq: ['$status', 'active'] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: '_activeSub',
      },
    },
    {
      $addFields: {
        chartCount: { $size: '$_charts' },
        hasActiveSubscription: { $gt: [{ $size: '$_activeSub' }, 0] },
        effectivePlan: {
          $cond: {
            if: {
              $or: [
                { $not: { $in: ['$plan', ['gold', 'platinum']] } },
                {
                  $and: [
                    { $ne: ['$planExpiresAt', null] },
                    { $lt: ['$planExpiresAt', now] },
                  ],
                },
              ],
            },
            then: 'free',
            else: '$plan',
          },
        },
      },
    },
  ]

  if (filters.effectivePlan) {
    stages.push({ $match: { effectivePlan: filters.effectivePlan } })
  }

  stages.push(
    { $project: { passwordHash: 0, _charts: 0, _activeSub: 0, devices: 0, preferences: 0 } },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $sort: sort }, { $skip: filters.skip }, { $limit: filters.limit }],
        summary: [
          {
            $group: {
              _id: '$effectivePlan',
              count: { $sum: 1 },
            },
          },
        ],
        admins: [{ $match: { role: 'admin' } }, { $count: 'count' }],
      },
    },
  )

  return stages
}

export function parseUserListFilters(searchParams: URLSearchParams, skip: number, limit: number): UserListFilters {
  const sort = searchParams.get('sort') as UserListSort | null
  const validSorts: UserListSort[] = ['createdAt', 'name', 'plan', 'chartCount']
  return {
    search: searchParams.get('search') || undefined,
    role: (searchParams.get('role') as 'user' | 'admin' | null) || undefined,
    plan: (searchParams.get('plan') as 'free' | 'gold' | 'platinum' | null) || undefined,
    effectivePlan: (searchParams.get('effectivePlan') as 'free' | 'gold' | 'platinum' | null) || undefined,
    sort: sort && validSorts.includes(sort) ? sort : 'createdAt',
    sortDir: searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc',
    skip,
    limit,
  }
}

export function formatUserSummary(facet: {
  summary?: Array<{ _id: string; count: number }>
  admins?: Array<{ count: number }>
  metadata?: Array<{ total: number }>
}) {
  const byEffectivePlan = { free: 0, gold: 0, platinum: 0 }
  for (const row of facet.summary || []) {
    if (row._id === 'gold' || row._id === 'platinum' || row._id === 'free') {
      byEffectivePlan[row._id] = row.count
    }
  }
  return {
    total: facet.metadata?.[0]?.total ?? 0,
    admins: facet.admins?.[0]?.count ?? 0,
    byEffectivePlan,
  }
}

export function enrichUserRow(user: {
  plan?: string
  planExpiresAt?: Date | string | null
  [key: string]: unknown
}) {
  return {
    ...user,
    effectivePlan: getEffectivePlan(user.plan, user.planExpiresAt),
  }
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(base: Date, months: number): Date {
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d
}
