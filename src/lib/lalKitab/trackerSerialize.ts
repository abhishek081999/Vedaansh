// ─────────────────────────────────────────────────────────────
//  src/lib/lalKitab/trackerSerialize.ts
//  Shape a LalKitabRemedy document for the client, with today's day
//  state worked out on the server in the tracker's own time zone.
// ─────────────────────────────────────────────────────────────

import { lkTrackerState, type LkTrackerState } from '@/lib/engine/lalKitab/trackerDays'

interface RemedyLike {
  _id: { toString(): string }
  upayId: string
  planet: string
  startedAt: Date
  timeZone?: string
  days: boolean[]
  status: string
  chartKey: string
}

export interface TrackerClientRow extends LkTrackerState {
  _id: string
  upayId: string
  planet: string
  startedAt: Date
  timeZone: string
  days: boolean[]
  status: string
  chartKey: string
}

export function toTrackerClient(r: RemedyLike, now: Date = new Date()): TrackerClientRow {
  const timeZone = r.timeZone || 'UTC'
  const days = [...r.days]
  return {
    _id: r._id.toString(),
    upayId: r.upayId,
    planet: r.planet,
    startedAt: r.startedAt,
    timeZone,
    days,
    status: r.status,
    chartKey: r.chartKey,
    ...lkTrackerState(days, new Date(r.startedAt), now, timeZone),
  }
}
