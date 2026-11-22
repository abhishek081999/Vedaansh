// ─────────────────────────────────────────────────────────────
//  src/lib/remedies/practiceSerialize.ts
//  Shape a RemedyPractice document for the client, with today's
//  state worked out on the server in the tracker's own time zone.
// ─────────────────────────────────────────────────────────────

import { practiceTrackerState, type PracticeTrackerState } from '@/lib/engine/remedyPractices'

interface PracticeLike {
  _id: { toString(): string }
  practiceId: string
  graha: string
  cadence: 'daily' | 'weekly'
  weekday?: number | null
  startedAt: Date
  timeZone?: string
  days: boolean[]
  status: string
  chartKey: string
}

export interface PracticeClientRow extends PracticeTrackerState {
  _id: string
  practiceId: string
  graha: string
  cadence: 'daily' | 'weekly'
  weekday: number | null
  startedAt: Date
  timeZone: string
  days: boolean[]
  status: string
  chartKey: string
}

export function practiceState(r: PracticeLike, now: Date = new Date()): PracticeTrackerState {
  return practiceTrackerState(
    { cadence: r.cadence, weekday: r.weekday ?? undefined },
    r.days,
    new Date(r.startedAt),
    now,
    r.timeZone || 'UTC',
  )
}

export function toPracticeClient(r: PracticeLike, now: Date = new Date()): PracticeClientRow {
  return {
    _id: r._id.toString(),
    practiceId: r.practiceId,
    graha: r.graha,
    cadence: r.cadence,
    weekday: r.weekday ?? null,
    startedAt: r.startedAt,
    timeZone: r.timeZone || 'UTC',
    days: [...r.days],
    status: r.status,
    chartKey: r.chartKey,
    ...practiceState(r, now),
  }
}
