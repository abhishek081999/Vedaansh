/**
 * src/lib/engine/muhurtaVerdict.ts
 * Plain-language verdicts for daily use.
 */

import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import type { MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import { muhurtaActivityLabel, type MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'
import { buildVerdictHi, MV_HI } from '@/lib/engine/locale/muhurtaVerdict.hi'

export function plainMuhurtaVerdict(
  activity: MuhurtaActivity,
  score: MuhurtaScore,
  opts?: { timeLabel?: string; avoidNow?: string[]; lang?: EngineLang },
): { headline: string; detail: string; tone: 'good' | 'ok' | 'caution' | 'avoid' } {
  const lang = opts?.lang ?? 'en'
  const act = muhurtaActivityLabel(activity, lang)
  const actLower = act
  const when =
    opts?.timeLabel && lang === 'hi'
      ? fill(MV_HI.whenAround, { time: opts.timeLabel })
      : opts?.timeLabel
        ? ` around ${opts.timeLabel}`
        : ''
  const avoid =
    opts?.avoidNow?.length && lang === 'hi'
      ? fill(MV_HI.avoidPrefix, { list: opts.avoidNow.join(', ') })
      : opts?.avoidNow?.length
        ? ` Avoid: ${opts.avoidNow.join(', ')}.`
        : ''

  const scoreVal = typeof score.score === 'number' ? score.score : 0
  const labelEn =
    scoreVal >= 80
      ? 'Excellent'
      : scoreVal >= 65
        ? 'Good'
        : scoreVal >= 45
          ? 'Neutral'
          : scoreVal >= 30
            ? 'Challenging'
            : 'Avoid'

  const mapKind = (): 'excellent' | 'good' | 'neutral' | 'caution' | 'avoid' => {
    if (labelEn === 'Excellent' || scoreVal >= 80) return 'excellent'
    if (labelEn === 'Good' || scoreVal >= 65) return 'good'
    if (labelEn === 'Neutral' || scoreVal >= 45) return 'neutral'
    if (labelEn === 'Challenging' || scoreVal >= 30) return 'caution'
    return 'avoid'
  }

  if (lang === 'hi') {
    const v = buildVerdictHi(mapKind(), act, actLower, when, avoid)
    return {
      ...v,
      tone:
        mapKind() === 'excellent' || mapKind() === 'good'
          ? 'good'
          : mapKind() === 'neutral'
            ? 'ok'
            : mapKind() === 'caution'
              ? 'caution'
              : 'avoid',
    }
  }

  if (score.label === 'Excellent' || score.score >= 80) {
    return {
      headline: `Good time for ${act}${when}`,
      detail: `Conditions look supportive for ${act.toLowerCase()}. It is a good time to go ahead.${avoid}`,
      tone: 'good',
    }
  }
  if (score.label === 'Good' || score.score >= 65) {
    return {
      headline: `Fairly good for ${act}${when}`,
      detail: `Most factors are okay for ${act.toLowerCase()}. Prefer this window over weaker ones.${avoid}`,
      tone: 'good',
    }
  }
  if (score.label === 'Neutral' || score.score >= 45) {
    return {
      headline: `Mixed for ${act}${when}`,
      detail: `Neither strongly favorable nor forbidden. Routine work is fine; major beginnings can wait.${avoid}`,
      tone: 'ok',
    }
  }
  if (score.label === 'Challenging' || score.score >= 30) {
    return {
      headline: `Better to wait for ${act}${when}`,
      detail: `Several factors are challenging. Postpone important starts if you can.${avoid}`,
      tone: 'caution',
    }
  }
  return {
    headline: `Avoid starting ${act}${when}`,
    detail: `Classical rules advise against starting this right now. A later time is a better choice.${avoid}`,
    tone: 'avoid',
  }
}

/** Pick best upcoming slot within next N hours from timeline points. */
export function pickBestUpcoming(
  points: { time: string; score: MuhurtaScore }[],
  now = Date.now(),
  withinMs = 2 * 60 * 60 * 1000,
): { time: string; score: MuhurtaScore } | null {
  const end = now + withinMs
  let best: { time: string; score: MuhurtaScore } | null = null
  for (const p of points) {
    const t = new Date(p.time).getTime()
    if (t < now - 15 * 60 * 1000 || t > end) continue
    if (!best || p.score.score > best.score.score) best = p
  }
  return best
}

export function formatClock(iso: string, lang: EngineLang = 'en'): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : [], { hour: '2-digit', minute: '2-digit' })
}
