// ─────────────────────────────────────────────────────────────
//  src/lib/social/posts/schema.ts
//  Zod schemas + range helpers for the Social Studio calendar API.
//  Pure (no DB) so they can be unit-tested.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod'

export const SOCIAL_FORMATS = ['4x5', '1x1', '9x16'] as const
export const SOCIAL_STATUSES = ['idea', 'draft', 'ready', 'posted'] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const TEMPLATE_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i

/** IST offset used for calendar day boundaries (brand page is India-first). */
export const CALENDAR_TZ_OFFSET = '+05:30'

/** Max span for a ?from&to list query. */
export const MAX_LIST_RANGE_DAYS = 366

/** Accepts YYYY-MM-DD (interpreted as that IST day start) or a full ISO instant. */
const scheduledForSchema = z.string().trim().min(10).max(40).refine(
  (v) => parseScheduledFor(v) !== null,
  'scheduledFor must be YYYY-MM-DD or an ISO date-time',
)

export function parseScheduledFor(v: string): Date | null {
  const d = DATE_RE.test(v) ? new Date(`${v}T00:00:00${CALENDAR_TZ_OFFSET}`) : new Date(v)
  return Number.isFinite(d.getTime()) ? d : null
}

const paramsSchema = z.record(z.string().max(64), z.unknown()).refine(
  (p) => JSON.stringify(p).length <= 8_000,
  'params too large',
)

export const createSocialPostSchema = z.object({
  templateId:   z.string().trim().regex(TEMPLATE_RE, 'Invalid templateId'),
  params:       paramsSchema.default({}),
  scheduledFor: scheduledForSchema,
  format:       z.enum(SOCIAL_FORMATS).default('4x5'),
  status:       z.enum(SOCIAL_STATUSES).default('idea'),
  caption:      z.string().max(2_200).default(''),
  notes:        z.string().max(2_000).optional(),
  eventRef:     z.string().trim().max(160).optional(),
}).strict()

export const updateSocialPostSchema = z.object({
  templateId:   z.string().trim().regex(TEMPLATE_RE, 'Invalid templateId').optional(),
  params:       paramsSchema.optional(),
  scheduledFor: scheduledForSchema.optional(),
  format:       z.enum(SOCIAL_FORMATS).optional(),
  status:       z.enum(SOCIAL_STATUSES).optional(),
  caption:      z.string().max(2_200).optional(),
  notes:        z.string().max(2_000).nullable().optional(),
  eventRef:     z.string().trim().max(160).nullable().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, 'No fields to update')

export const listSocialPostsQuerySchema = z.object({
  month:      z.string().regex(MONTH_RE, 'month must be YYYY-MM').optional(),
  from:       z.string().regex(DATE_RE, 'from must be YYYY-MM-DD').optional(),
  to:         z.string().regex(DATE_RE, 'to must be YYYY-MM-DD').optional(),
  status:     z.enum(SOCIAL_STATUSES).optional(),
  templateId: z.string().regex(TEMPLATE_RE, 'Invalid templateId').optional(),
}).refine((q) => Boolean(q.month) !== Boolean(q.from || q.to), 'Pass either month or from+to')
  .refine((q) => q.month || (q.from && q.to), 'Both from and to are required')

export type ListSocialPostsQuery = z.infer<typeof listSocialPostsQuerySchema>

/** [start, end) instants for a list query, using IST day boundaries. */
export function resolveListRange(q: ListSocialPostsQuery): { start: Date; end: Date } | { error: string } {
  let start: Date
  let end: Date
  if (q.month) {
    const [y, m] = q.month.split('-').map(Number)
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
    start = new Date(`${q.month}-01T00:00:00${CALENDAR_TZ_OFFSET}`)
    end = new Date(`${next}-01T00:00:00${CALENDAR_TZ_OFFSET}`)
  } else {
    start = new Date(`${q.from}T00:00:00${CALENDAR_TZ_OFFSET}`)
    end = new Date(new Date(`${q.to}T00:00:00${CALENDAR_TZ_OFFSET}`).getTime() + 86_400_000)
  }
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return { error: 'Invalid date' }
  if (end <= start) return { error: '`to` must not be before `from`' }
  if ((end.getTime() - start.getTime()) / 86_400_000 > MAX_LIST_RANGE_DAYS) {
    return { error: `Range may not exceed ${MAX_LIST_RANGE_DAYS} days` }
  }
  return { start, end }
}
