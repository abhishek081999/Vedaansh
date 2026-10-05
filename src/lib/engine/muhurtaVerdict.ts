/**
 * src/lib/engine/muhurtaVerdict.ts
 * Plain-language verdicts for daily use.
 */

import type { MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import { MUHURTA_ACTIVITY_LABELS, type MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'

export function plainMuhurtaVerdict(
  activity: MuhurtaActivity,
  score: MuhurtaScore,
  opts?: { timeLabel?: string; avoidNow?: string[] },
): { headline: string; detail: string; tone: 'good' | 'ok' | 'caution' | 'avoid' } {
  const act = MUHURTA_ACTIVITY_LABELS[activity]
  const when = opts?.timeLabel ? ` around ${opts.timeLabel}` : ''
  const avoid = opts?.avoidNow?.length
    ? ` Avoid: ${opts.avoidNow.join(', ')}.`
    : ''

  if (score.label === 'Excellent' || score.score >= 80) {
    return {
      headline: `Good time for ${act}${when}`,
      detail: `Conditions look supportive for ${act.toLowerCase()}. You can proceed with confidence.${avoid}`,
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
    detail: `Timing is classically avoided right now.${avoid}`,
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

export function formatClock(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
