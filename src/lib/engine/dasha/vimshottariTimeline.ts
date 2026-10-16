// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariTimeline.ts
//  Upcoming antardasha + next mahadasha timeline with soft tone
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  getVimshottariAntarHint,
  getVimshottariInterpretation,
  isBeneficVimNature,
  isMaleficVimNature,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import { isChidraAntardasha } from '@/lib/engine/dasha/vimshottariAnalysis'

export type TimelineTone = 'supportive' | 'mixed' | 'caution'

export interface UpcomingDashaItem {
  kind: 'antar' | 'maha'
  lord: GrahaId
  mahaLord: GrahaId
  startIso: string
  endIso: string
  tone: TimelineTone
  toneLabel: string
  hint: string | null
  label: string
}

export interface VimshottariUpcomingTimeline {
  upcomingAntars: UpcomingDashaItem[]
  nextMaha: UpcomingDashaItem | null
  headline: string
}

function toIso(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isFinite(d.getTime()) ? d.toISOString() : ''
}

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return new Date(value).getTime()
}

function toneForAntar(mahaLord: string, antarLord: string): {
  tone: TimelineTone
  toneLabel: string
} {
  const interp = getVimshottariInterpretation(antarLord)
  const chidra = isChidraAntardasha(mahaLord, antarLord)
  if (chidra.isChidra) {
    return {
      tone: 'caution',
      toneLabel: chidra.phase === 'beginning' ? 'Setup / Chidra' : 'Transition / Chidra',
    }
  }
  if (interp && isBeneficVimNature(interp.nature)) {
    return { tone: 'supportive', toneLabel: 'Supportive colour' }
  }
  if (interp && isMaleficVimNature(interp.nature)) {
    return { tone: 'caution', toneLabel: 'Caution colour' }
  }
  return { tone: 'mixed', toneLabel: 'Mixed colour' }
}

/**
 * Next 3–5 antardashas from now (including remaining current if desired),
 * plus the next mahadasha change.
 */
export function buildUpcomingVimshottariTimeline(
  nodes: DashaNode[],
  now: number = Date.now(),
  antarLimit = 5,
): VimshottariUpcomingTimeline {
  const path = getDashaPathAt(nodes, now)
  const currentMaha = path[0] ?? nodes.find(n => toMs(n.start) <= now && now < toMs(n.end)) ?? null

  const upcomingAntars: UpcomingDashaItem[] = []

  if (currentMaha?.children?.length) {
    const antars = [...currentMaha.children].sort((a, b) => toMs(a.start) - toMs(b.start))
    for (const a of antars) {
      if (toMs(a.end) <= now) continue
      const { tone, toneLabel } = toneForAntar(currentMaha.lord, a.lord)
      const hint = getVimshottariAntarHint(currentMaha.lord, a.lord)
      const isCurrent = toMs(a.start) <= now && now < toMs(a.end)
      upcomingAntars.push({
        kind: 'antar',
        lord: a.lord as GrahaId,
        mahaLord: currentMaha.lord as GrahaId,
        startIso: toIso(a.start),
        endIso: toIso(a.end),
        tone,
        toneLabel: isCurrent ? `Now · ${toneLabel}` : toneLabel,
        hint,
        label: isCurrent
          ? `Current ${GRAHA_NAMES[a.lord as GrahaId] ?? a.lord} Antar`
          : `${GRAHA_NAMES[a.lord as GrahaId] ?? a.lord} Antar`,
      })
      if (upcomingAntars.length >= antarLimit) break
    }
  }

  // If fewer than limit, peek into next mahadasha's first antars
  if (upcomingAntars.length < antarLimit) {
    const mahas = [...nodes].sort((a, b) => toMs(a.start) - toMs(b.start))
    const nextMahas = mahas.filter(m => toMs(m.start) > now || (currentMaha && m.lord !== currentMaha.lord && toMs(m.start) >= toMs(currentMaha.end)))
    for (const m of nextMahas) {
      if (toMs(m.start) < now && (!currentMaha || m === currentMaha)) continue
      if (currentMaha && toMs(m.start) < toMs(currentMaha.end) - 1) continue
      const antars = [...(m.children ?? [])].sort((a, b) => toMs(a.start) - toMs(b.start))
      for (const a of antars) {
        if (toMs(a.end) <= now) continue
        const { tone, toneLabel } = toneForAntar(m.lord, a.lord)
        upcomingAntars.push({
          kind: 'antar',
          lord: a.lord as GrahaId,
          mahaLord: m.lord as GrahaId,
          startIso: toIso(a.start),
          endIso: toIso(a.end),
          tone,
          toneLabel,
          hint: getVimshottariAntarHint(m.lord, a.lord),
          label: `${GRAHA_NAMES[a.lord as GrahaId] ?? a.lord} Antar (${GRAHA_NAMES[m.lord as GrahaId] ?? m.lord} MD)`,
        })
        if (upcomingAntars.length >= antarLimit) break
      }
      if (upcomingAntars.length >= antarLimit) break
    }
  }

  let nextMaha: UpcomingDashaItem | null = null
  const mahas = [...nodes].sort((a, b) => toMs(a.start) - toMs(b.start))
  const following = mahas.find(m => toMs(m.start) > now)
  if (following) {
    const interp = getVimshottariInterpretation(following.lord)
    const tone: TimelineTone =
      interp && isBeneficVimNature(interp.nature)
        ? 'supportive'
        : interp && isMaleficVimNature(interp.nature)
          ? 'caution'
          : 'mixed'
    nextMaha = {
      kind: 'maha',
      lord: following.lord as GrahaId,
      mahaLord: following.lord as GrahaId,
      startIso: toIso(following.start),
      endIso: toIso(following.end),
      tone,
      toneLabel: 'Next Mahadasha',
      hint: interp?.keyTheme ?? null,
      label: `${GRAHA_NAMES[following.lord as GrahaId] ?? following.lord} Mahadasha`,
    }
  }

  const parts: string[] = []
  if (upcomingAntars[0]) {
    const first = upcomingAntars[0]
    parts.push(
      first.toneLabel.startsWith('Now')
        ? `Current antar through ${formatShortDate(first.endIso)}`
        : `Next antar ${first.label} from ${formatShortDate(first.startIso)}`,
    )
  }
  if (nextMaha) {
    parts.push(`Next MD ${GRAHA_NAMES[nextMaha.lord] ?? nextMaha.lord} from ${formatShortDate(nextMaha.startIso)}`)
  }

  return {
    upcomingAntars,
    nextMaha,
    headline: parts.length ? parts.join(' · ') : 'No upcoming Vimshottari periods in range.',
  }
}

export function formatShortDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
