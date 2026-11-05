// ─────────────────────────────────────────────────────────────
//  /api/admin/social/{posts,posts/[id],events} reject anonymous (401)
//  and signed-in non-admin (403) callers before touching the DB.
//  Auth, DB, Redis and the ephemeris finder are mocked — no real
//  next-auth / mongoose / redis imports.
// ─────────────────────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const authMock = vi.fn()
const requireAdminMock = vi.fn()
const connectDBMock = vi.fn()
const findCalendarEventsMock = vi.fn(() => [])
const socialPostMock = {
  find: vi.fn(() => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) })),
  create: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
}

vi.mock('@/auth', () => ({ auth: () => authMock() }))
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: () => requireAdminMock() }))
vi.mock('@/lib/admin/audit', () => ({ logAdminAction: vi.fn() }))
vi.mock('@/lib/db/mongodb', () => ({ default: () => connectDBMock() }))
vi.mock('@/lib/db/models/SocialPost', () => ({ SocialPost: socialPostMock }))
vi.mock('mongoose', () => ({ default: { isValidObjectId: () => true } }))
vi.mock('@/lib/redis', () => ({ redis: { get: vi.fn(async () => null), set: vi.fn(async () => undefined) } }))
vi.mock('@/lib/social/events/finder', () => ({
  EVENT_LOCATIONS: { delhi: { id: 'delhi' }, ujjain: { id: 'ujjain' } },
  MAX_EVENT_RANGE_DAYS: 62,
  findCalendarEvents: () => findCalendarEventsMock(),
}))
vi.mock('@/lib/security/presets', () => ({
  guardRoute: vi.fn(async () => null),
  routeSecurityPresets: { adminRead: () => ({}), adminMutate: () => ({}) },
}))

const ORIGIN = 'https://vedaansh.com'
const ID = '64b7f0c2a1b2c3d4e5f60718'
const ctx = { params: Promise.resolve({ id: ID }) }

function req(path: string, method = 'GET', body?: unknown) {
  return new NextRequest(`${ORIGIN}${path}`, {
    method,
    headers: { origin: ORIGIN, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const validPost = { templateId: 'vrat', scheduledFor: '2026-11-20', format: '4x5', status: 'idea' }

async function callAll() {
  const posts = await import('@/app/api/admin/social/posts/route')
  const postById = await import('@/app/api/admin/social/posts/[id]/route')
  const events = await import('@/app/api/admin/social/events/route')
  return [
    await posts.GET(req('/api/admin/social/posts?month=2026-11')),
    await posts.POST(req('/api/admin/social/posts', 'POST', validPost)),
    await postById.PATCH(req(`/api/admin/social/posts/${ID}`, 'PATCH', { status: 'ready' }), ctx),
    await postById.DELETE(req(`/api/admin/social/posts/${ID}`, 'DELETE'), ctx),
    await events.GET(req('/api/admin/social/events?from=2026-11-01&to=2026-11-30')),
  ]
}

describe('admin social routes — access control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for anonymous callers on every route', async () => {
    authMock.mockResolvedValue(null)
    requireAdminMock.mockResolvedValue(null)
    for (const res of await callAll()) {
      expect(res.status).toBe(401)
      expect(await res.json()).toMatchObject({ success: false })
    }
    expect(connectDBMock).not.toHaveBeenCalled()
    expect(findCalendarEventsMock).not.toHaveBeenCalled()
  })

  it('returns 403 for signed-in non-admin callers on every route', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'user@example.com', role: 'user' } })
    requireAdminMock.mockResolvedValue(null)
    for (const res of await callAll()) {
      expect(res.status).toBe(403)
      expect(await res.json()).toMatchObject({ success: false })
    }
    expect(connectDBMock).not.toHaveBeenCalled()
    expect(socialPostMock.create).not.toHaveBeenCalled()
    expect(findCalendarEventsMock).not.toHaveBeenCalled()
  })

  it('lets admins through to validation (bad query → 400)', async () => {
    authMock.mockResolvedValue({ user: { id: 'a1', email: 'admin@example.com' } })
    requireAdminMock.mockResolvedValue({ user: { id: 'a1', email: 'admin@example.com', role: 'admin' } })
    const posts = await import('@/app/api/admin/social/posts/route')
    const events = await import('@/app/api/admin/social/events/route')
    expect((await posts.GET(req('/api/admin/social/posts?month=2026-13'))).status).toBe(400)
    expect((await events.GET(req('/api/admin/social/events?from=2026-01-01&to=2026-06-30'))).status).toBe(400)
    expect((await events.GET(req('/api/admin/social/events?from=2026-11-01&to=2026-11-30'))).status).toBe(200)
  })
})
