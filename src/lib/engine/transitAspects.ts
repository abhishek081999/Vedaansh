// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transitAspects.ts
//  Gochara aspects + double/triple transit windows (slow grahas)
// ─────────────────────────────────────────────────────────────

import {
  SWISSEPH_IDS,
  dateToJD,
  jdToDate,
  getPlanetPosition,
  signOf,
  ketuLongitude,
} from '@/lib/engine/ephemeris'
import { transitRelationToSign, type TransitRelation } from '@/lib/engine/aspects'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'

export type NatalTargetId = 'Lg' | GrahaId

export interface NatalTarget {
  id: NatalTargetId
  label: string
  rashi: Rashi
}

export interface TransitAspectHit {
  transitLord: GrahaId
  transitLordName: string
  targetId: NatalTargetId
  targetLabel: string
  relation: TransitRelation
  transitSign: Rashi
  transitSignName: string
  natalSign: Rashi
  natalSignName: string
  houseFromLagna: number
}

export type MultiTransitTone = 'supportive' | 'caution' | 'mixed'

export interface MultiTransitWindow {
  id: string
  grade: 2 | 3 | 4
  gradeLabel: string
  targetId: NatalTargetId
  targetLabel: string
  transitLords: GrahaId[]
  transitLordNames: string[]
  startIso: string
  endIso: string
  isCurrent: boolean
  tone: MultiTransitTone
  summary: string
}

export interface TransitAspectEvent {
  dateIso: string
  transitLord: GrahaId
  transitLordName: string
  targetId: NatalTargetId
  targetLabel: string
  relation: TransitRelation
  transitSign: Rashi
  transitSignName: string
  label: string
  detail: string
}

export interface TransitAspectReport {
  asOfIso: string
  windowStartIso: string
  windowEndIso: string
  nowHits: TransitAspectHit[]
  nowMulti: MultiTransitWindow[]
  multiWindows: MultiTransitWindow[]
  upcomingEvents: TransitAspectEvent[]
  summary: string
}

const MAJOR_LORDS: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke']
const NATAL_GRAHA_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

interface SignSegment {
  rashi: Rashi
  startJd: number
  endJd: number
}

function utcNoon(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0))
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function houseFromLagna(sign: Rashi, ascRashi: Rashi): number {
  return ((sign - ascRashi + 12) % 12) + 1
}

function planetRashiAtJd(pid: GrahaId, jd: number): Rashi {
  if (pid === 'Ke') {
    const rahu = getPlanetPosition(jd, SWISSEPH_IDS.Ra, true)
    return signOf(ketuLongitude(rahu.longitude)) as Rashi
  }
  const pos = getPlanetPosition(jd, SWISSEPH_IDS[pid as keyof typeof SWISSEPH_IDS], true)
  return signOf(pos.longitude) as Rashi
}

function findSignChangeJd(pid: GrahaId, leftJd: number, rightJd: number, prevRashi: Rashi): number {
  let lo = leftJd
  let hi = rightJd
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (planetRashiAtJd(pid, mid) === prevRashi) lo = mid
    else hi = mid
  }
  return hi
}

export function buildPlanetSignTimeline(pid: GrahaId, startDate: Date, endDate: Date): SignSegment[] {
  const start = utcNoon(startDate)
  const end = utcNoon(endDate)
  const startJd = dateToJD(start)
  const endJd = dateToJD(end)
  if (endJd <= startJd) return []

  const stepDays = pid === 'Ju' || pid === 'Sa' || pid === 'Ra' || pid === 'Ke' ? 5 : 2
  const segments: SignSegment[] = []
  let boundaryJd = startJd
  let prevRashi = planetRashiAtJd(pid, boundaryJd)

  for (let jd = startJd + stepDays; jd <= endJd + stepDays; jd += stepDays) {
    const sampleJd = Math.min(jd, endJd)
    const rashi = planetRashiAtJd(pid, sampleJd)
    if (rashi !== prevRashi) {
      const changeJd = findSignChangeJd(pid, boundaryJd, sampleJd, prevRashi)
      segments.push({ rashi: prevRashi, startJd: boundaryJd, endJd: changeJd })
      boundaryJd = changeJd
      prevRashi = rashi
    }
    if (sampleJd >= endJd) break
  }
  segments.push({ rashi: prevRashi, startJd: boundaryJd, endJd: endJd })
  return segments.filter(s => s.endJd > s.startJd)
}

function rashiAt(timeline: SignSegment[], jd: number): Rashi | null {
  for (const seg of timeline) {
    if (jd >= seg.startJd && jd < seg.endJd) return seg.rashi
    // last segment may include endJd exclusive — treat end as previous
    if (jd === seg.endJd && seg === timeline[timeline.length - 1]) return seg.rashi
  }
  // fallback: last segment whose start <= jd
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    if (jd >= timeline[i].startJd) return timeline[i].rashi
  }
  return timeline[0]?.rashi ?? null
}

export function buildNatalTargets(
  ascRashi: Rashi,
  natalRashis: Partial<Record<GrahaId, Rashi>>,
): NatalTarget[] {
  const targets: NatalTarget[] = [
    { id: 'Lg', label: 'Lagna', rashi: ascRashi },
  ]
  for (const id of NATAL_GRAHA_ORDER) {
    const r = natalRashis[id]
    if (r == null) continue
    targets.push({ id, label: GRAHA_NAMES[id], rashi: r })
  }
  return targets
}

function hitsAtSigns(
  lordSigns: Partial<Record<GrahaId, Rashi>>,
  targets: NatalTarget[],
  ascRashi: Rashi,
): TransitAspectHit[] {
  const hits: TransitAspectHit[] = []
  for (const lord of MAJOR_LORDS) {
    const tSign = lordSigns[lord]
    if (tSign == null) continue
    for (const target of targets) {
      const rel = transitRelationToSign(tSign, lord, target.rashi)
      if (!rel) continue
      hits.push({
        transitLord: lord,
        transitLordName: GRAHA_NAMES[lord],
        targetId: target.id,
        targetLabel: target.label,
        relation: rel,
        transitSign: tSign,
        transitSignName: RASHI_NAMES[tSign],
        natalSign: target.rashi,
        natalSignName: RASHI_NAMES[target.rashi],
        houseFromLagna: houseFromLagna(tSign, ascRashi),
      })
    }
  }
  return hits
}

function toneForLords(lords: GrahaId[]): MultiTransitTone {
  const hasJu = lords.includes('Ju')
  const hasSa = lords.includes('Sa')
  const hasNode = lords.includes('Ra') || lords.includes('Ke')
  if (hasJu && !hasSa && !hasNode) return 'supportive'
  if (hasSa && !hasJu) return 'caution'
  if (hasJu && hasSa) return 'mixed'
  if (hasNode && !hasJu) return 'caution'
  return 'mixed'
}

function gradeLabel(n: number): string {
  if (n >= 4) return 'Quadruple transit'
  if (n === 3) return 'Triple transit'
  return 'Double transit'
}

function lordsKey(lords: GrahaId[]): string {
  return [...lords].sort().join('+')
}

function multiFromHits(
  hits: TransitAspectHit[],
  startIso: string,
  endIso: string,
  nowMs: number,
): MultiTransitWindow[] {
  const byTarget = new Map<NatalTargetId, TransitAspectHit[]>()
  for (const h of hits) {
    const list = byTarget.get(h.targetId) ?? []
    list.push(h)
    byTarget.set(h.targetId, list)
  }

  const windows: MultiTransitWindow[] = []
  for (const [targetId, list] of byTarget) {
    const uniqueLords = [...new Set(list.map(h => h.transitLord))]
    if (uniqueLords.length < 2) continue
    const grade = Math.min(4, uniqueLords.length) as 2 | 3 | 4
    const startMs = new Date(`${startIso}T12:00:00Z`).getTime()
    const endMs = new Date(`${endIso}T12:00:00Z`).getTime()
    const isCurrent = nowMs >= startMs && nowMs < endMs
    const tone = toneForLords(uniqueLords)
    const targetLabel = list[0].targetLabel
    const names = uniqueLords.map(id => GRAHA_NAMES[id])
    windows.push({
      id: `${targetId}-${lordsKey(uniqueLords)}-${startIso}`,
      grade,
      gradeLabel: gradeLabel(grade),
      targetId,
      targetLabel,
      transitLords: uniqueLords,
      transitLordNames: names,
      startIso,
      endIso,
      isCurrent,
      tone,
      summary: `${gradeLabel(grade)} on natal ${targetLabel}: ${names.join(' + ')} (${list.map(h => h.relation).join(', ')}).`,
    })
  }
  return windows
}

function mergeMultiWindows(windows: MultiTransitWindow[]): MultiTransitWindow[] {
  if (windows.length === 0) return []
  const sorted = [...windows].sort((a, b) => {
    const t = a.targetId.localeCompare(b.targetId)
    if (t !== 0) return t
    const l = lordsKey(a.transitLords).localeCompare(lordsKey(b.transitLords))
    if (l !== 0) return l
    return a.startIso.localeCompare(b.startIso)
  })

  const out: MultiTransitWindow[] = [{ ...sorted[0] }]
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = out[out.length - 1]
    const cur = sorted[i]
    const same =
      prev.targetId === cur.targetId &&
      lordsKey(prev.transitLords) === lordsKey(cur.transitLords) &&
      prev.endIso === cur.startIso
    if (same) {
      prev.endIso = cur.endIso
      if (cur.isCurrent) prev.isCurrent = true
    } else {
      out.push({ ...cur })
    }
  }
  return out
}

export interface AnalyzeTransitAspectsInput {
  ascRashi: Rashi
  natalRashis: Partial<Record<GrahaId, Rashi>>
  asOf?: Date
  months?: number
}

/**
 * Slow-planet gochara aspects + overlapping double/triple windows.
 */
export function analyzeTransitAspects(input: AnalyzeTransitAspectsInput): TransitAspectReport {
  const asOf = utcNoon(input.asOf ?? new Date())
  const months = Math.max(1, Math.min(36, input.months ?? 18))
  const windowStart = asOf
  const windowEnd = new Date(asOf)
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + months)

  const targets = buildNatalTargets(input.ascRashi, input.natalRashis)
  const timelines: Record<GrahaId, SignSegment[]> = {
    Ju: buildPlanetSignTimeline('Ju', windowStart, windowEnd),
    Sa: buildPlanetSignTimeline('Sa', windowStart, windowEnd),
    Ra: buildPlanetSignTimeline('Ra', windowStart, windowEnd),
    Ke: buildPlanetSignTimeline('Ke', windowStart, windowEnd),
  } as Record<GrahaId, SignSegment[]>

  const boundaries = new Set<number>()
  const startJd = dateToJD(windowStart)
  const endJd = dateToJD(windowEnd)
  boundaries.add(startJd)
  boundaries.add(endJd)
  for (const pid of MAJOR_LORDS) {
    for (const seg of timelines[pid]) {
      boundaries.add(seg.startJd)
      boundaries.add(seg.endJd)
    }
  }
  const sortedBounds = [...boundaries].sort((a, b) => a - b)

  const nowMs = asOf.getTime()
  const nowJd = dateToJD(asOf)
  const nowSigns: Partial<Record<GrahaId, Rashi>> = {}
  for (const pid of MAJOR_LORDS) {
    nowSigns[pid] = planetRashiAtJd(pid, nowJd)
  }
  const nowHits = hitsAtSigns(nowSigns, targets, input.ascRashi)
  const nowMulti = multiFromHits(
    nowHits,
    toIsoDate(asOf),
    toIsoDate(new Date(asOf.getTime() + 24 * 60 * 60 * 1000)),
    nowMs,
  ).map(w => ({ ...w, isCurrent: true, endIso: w.startIso }))

  // Rebuild nowMulti with open-ended current feel — use actual overlapping window later
  const rawMulti: MultiTransitWindow[] = []
  const upcomingEvents: TransitAspectEvent[] = []
  let prevHitKeys = new Set<string>()

  for (let i = 0; i < sortedBounds.length - 1; i += 1) {
    const a = sortedBounds[i]
    const b = sortedBounds[i + 1]
    if (b <= a) continue
    const mid = (a + b) / 2
    const signs: Partial<Record<GrahaId, Rashi>> = {}
    for (const pid of MAJOR_LORDS) {
      const r = rashiAt(timelines[pid], mid)
      if (r != null) signs[pid] = r
    }
    const hits = hitsAtSigns(signs, targets, input.ascRashi)
    const startIso = toIsoDate(jdToDate(a))
    const endIso = toIsoDate(jdToDate(b))
    rawMulti.push(...multiFromHits(hits, startIso, endIso, nowMs))

    const hitKeys = new Set(hits.map(h => `${h.transitLord}:${h.targetId}:${h.relation}`))
    if (a >= nowJd - 0.01) {
      for (const h of hits) {
        const key = `${h.transitLord}:${h.targetId}:${h.relation}`
        if (!prevHitKeys.has(key)) {
          upcomingEvents.push({
            dateIso: startIso,
            transitLord: h.transitLord,
            transitLordName: h.transitLordName,
            targetId: h.targetId,
            targetLabel: h.targetLabel,
            relation: h.relation,
            transitSign: h.transitSign,
            transitSignName: h.transitSignName,
            label: `${h.transitLordName} ${h.relation === 'conjunction' ? 'over' : 'aspects'} ${h.targetLabel}`,
            detail: `Transit ${h.transitLordName} in ${h.transitSignName} ${h.relation === 'conjunction' ? 'conjuncts' : 'aspects'} natal ${h.targetLabel} (${h.natalSignName}).`,
          })
        }
      }
    }
    prevHitKeys = hitKeys
  }

  const multiWindows = mergeMultiWindows(rawMulti)
    .filter(w => w.grade >= 2)
    .sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
      return a.startIso.localeCompare(b.startIso)
    })

  // Prefer real current multi windows from timeline
  const currentMulti = multiWindows.filter(w => w.isCurrent)
  const effectiveNowMulti = currentMulti.length > 0 ? currentMulti : nowMulti.filter(w => w.grade >= 2)

  const upcomingUnique = upcomingEvents
    .filter((ev, idx, arr) =>
      arr.findIndex(x =>
        x.dateIso === ev.dateIso &&
        x.transitLord === ev.transitLord &&
        x.targetId === ev.targetId &&
        x.relation === ev.relation,
      ) === idx,
    )
    .slice(0, 40)

  const summaryParts: string[] = []
  if (effectiveNowMulti.length) {
    summaryParts.push(
      `Active: ${effectiveNowMulti.slice(0, 2).map(w => `${w.gradeLabel} on ${w.targetLabel}`).join('; ')}.`,
    )
  } else if (nowHits.length) {
    summaryParts.push(
      `Now: ${nowHits.slice(0, 3).map(h => `${h.transitLordName}→${h.targetLabel}`).join('; ')}.`,
    )
  } else {
    summaryParts.push('No major Ju/Sa/Ra/Ke aspects on natal points right now.')
  }
  const nextMulti = multiWindows.find(w => !w.isCurrent && new Date(w.startIso) > asOf)
  if (nextMulti) {
    summaryParts.push(`Next multi-transit: ${nextMulti.gradeLabel} on ${nextMulti.targetLabel} from ${nextMulti.startIso}.`)
  }

  return {
    asOfIso: toIsoDate(asOf),
    windowStartIso: toIsoDate(windowStart),
    windowEndIso: toIsoDate(windowEnd),
    nowHits,
    nowMulti: effectiveNowMulti,
    multiWindows,
    upcomingEvents: upcomingUnique,
    summary: summaryParts.join(' '),
  }
}
